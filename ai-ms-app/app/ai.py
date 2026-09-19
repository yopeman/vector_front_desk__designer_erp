import io
import threading
import uuid
from datetime import date
from functools import lru_cache

from fastapi import HTTPException, status
from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from app.config import settings

TEXT_EXTENSIONS = {
    ".txt", ".md", ".csv", ".json", ".log", ".py", ".html", ".xml", ".yml", ".yaml",
}

SYSTEM_PROMPT = (
    "You are Yope AI, the AI assistant for the Vector ERP platform. "
    "You help the ERP users answer questions, draft replies, "
    "summarise documents and retrieve information. Answer clearly and concisely "
    "in the language of the user's question. When relevant context from uploaded "
    "documents is provided between <context> tags, base your answer primarily on "
    "it and cite which document the information came from. If you don't know the "
    "answer or the context does not cover it, say so instead of guessing."
)


@lru_cache
def _embedder() -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(
        model=settings.google_embedding_model,
        google_api_key=settings.google_api_key,
        output_dimensionality=768,
    )


@lru_cache
def _chat_model() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.google_chat_model,
        google_api_key=settings.google_api_key,
        temperature=0.2,
        max_output_tokens=1024,
    )


def embedding_vector(text: str) -> str:
    """Return the 768-dim embedding of `text` as a Postgres vector literal string."""
    embedding = embed_texts([text])[0]
    return "[" + ",".join(str(round(x, 6)) for x in embedding) + "]"


def embed_texts(texts: list[str]) -> list[list[float]]:
    return _embedder().embed_documents(texts)


def extract_text(filename: str, data: bytes) -> str:
    """Extract plain text from an uploaded file based on its extension."""
    lowered = filename.lower()
    if lowered.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    if lowered.endswith(".docx"):
        import docx

        document = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in document.paragraphs)
    if any(lowered.endswith(ext) for ext in TEXT_EXTENSIONS):
        return data.decode("utf-8", errors="replace")
    # Fallback: attempt UTF-8 decode for any other text-ish type.
    return data.decode("utf-8", errors="replace")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=overlap
    )
    chunks = [c for c in splitter.split_text(text) if c.strip()]
    if not chunks:
        return [text] if text.strip() else []
    return chunks


def build_messages(
    history: list[dict], context: str, reference: str = ""
) -> list[SystemMessage | HumanMessage | AIMessage]:
    messages: list[SystemMessage | HumanMessage | AIMessage] = []
    system = SYSTEM_PROMPT
    if context:
        system += (
            "\n\nRelevant context from uploaded documents "
            f"({reference}):\n<context>{context}</context>"
        )
    messages.append(SystemMessage(content=system))
    for row in history:
        if row["role"] == "assistant":
            messages.append(AIMessage(content=row["content"]))
        else:
            messages.append(HumanMessage(content=row["content"]))
    return messages


def content_text(content) -> str:
    """Extract plain text from a chat message's content (str or content blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") in ("text", None):
                parts.append(block.get("text", "") or "")
        if parts:
            return "".join(parts).strip()
    return str(content)


def generate_reply(history: list[dict], context: str, reference: str = "") -> str:
    messages = build_messages(history, context, reference)
    response = _chat_model().invoke(messages)
    return content_text(response.content)


# ---------------------------------------------------------------------------
# Agent (tool-wielding, interrupt-capable) — powered by langchain.agents.create_agent
# ---------------------------------------------------------------------------

AGENT_SYSTEM_PROMPT = (
    "You are Yope AI, the AI assistant for the Vector ERP platform. You help ERP "
    "users retrieve and manage company data: clients, orders, designs, invoices, "
    "payments, production, machines, maintenance, inventory, marketing, finance "
    "and creative modules, as well as answer questions from documents the user "
    "uploaded to the chat.\n"
    f"Today is {date.today().isoformat()}. Amounts that are not labelled are in "
    "ETB (Ethiopian Birr).\n\n"
    "Rules:\n"
    "1. NEVER invent data. Always call a tool (query_records / get_schema) to "
    "look things up, and verify filters against real column values first with "
    "get_schema('<table>') when you are unsure.\n"
    "2. If the user's request is ambiguous or missing a detail you need to act "
    "- which client, which order/invoice number, dates, statuses, item names, "
    "quantities - call ask_user with one clear, specific question and wait for "
    "the answer. Do not guess. This is a hard rule: NEVER end your reply with a "
    "question asking the user for more information. If you would be tempted to "
    "ask anything, call the ask_user tool with that question and stop; only "
    "write text once you have a complete answer.\n"
    "3. For writes (insert_record / update_record / delete_record) you MUST "
    "confirm with the user through ask_user first, restate exactly what will "
    "change, and only act after explicit approval. Never delete or mass-update "
    "without a filter.\n"
    "4. Use search_attachments to answer questions about documents uploaded to "
    "this chat. Quote the source file when you use it, and say so if the file "
    "does not cover the question.\n"
    "5. Use get_caller to know who you are talking to. Their role determines "
    "which tables are visible: get_schema() only lists what the role may use, "
    "and anything else will be refused with an access error. Never try to work "
    "around a table that is outside the caller's role.\n"
    "6. Answer concisely and in the language of the user's question. Present "
    "numbers in a readable format. If a query returns nothing, say so and "
    "suggest how to narrow it down.\n"
    "7. Prefer the public-schema tables (clients, orders, invoices, ...). For "
    "finance data use finance_* (public schema) tables unless the user clearly "
    "refers to the 'finance' schema versions."
)

_pending_lock = threading.Lock()
_pending_interrupts: dict[str, str] = {}  # session_id -> graph thread_id
_checkpointer = MemorySaver()


@lru_cache
def _agent_graph():
    """Compile the langchain create_agent graph once (tools + checkpointer)."""
    from app import tools as agent_tools

    return create_agent(
        _chat_model(),
        tools=agent_tools.all_tools(),
        system_prompt=AGENT_SYSTEM_PROMPT,
        checkpointer=_checkpointer,
        name="yope_agent",
    )


def _pending_thread(session_id: str) -> str | None:
    with _pending_lock:
        return _pending_interrupts.get(session_id)


def _set_pending_thread(session_id: str, thread: str) -> None:
    with _pending_lock:
        _pending_interrupts[session_id] = thread


def _clear_pending_thread(session_id: str) -> None:
    with _pending_lock:
        _pending_interrupts.pop(session_id, None)


def _caller_context(user_id: str, session_id: str) -> dict:
    """Pull the caller's ERP profile so the tools know who to act for."""
    ctx = {
        "user_id": user_id,
        "session_id": session_id,
        "username": "Yope Auditor",
        "name": "Yope Auditor",
        "email": "auditor@vector.com",
        "role": "auditor",
        "department_id": None,
    }
    try:
        from app.db import db as _db

        row = (
            _db()
            .table("users")
            .select("id, username, email, role, department_id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
            .data
        )
        if row:
            ctx.update({k: row.get(k) for k in ("username", "email", "role", "department_id")})
            ctx["name"] = row.get("username")
    except Exception:  # noqa: BLE001
        pass
    return ctx


def _history_messages(history: list[dict]) -> list:
    messages = []
    for row in history:
        if row.get("role") == "assistant":
            messages.append(AIMessage(content=row.get("content", "")))
        else:
            messages.append(HumanMessage(content=row.get("content", "")))
    return messages


def _agent_result(session_id: str, thread: str, result: dict) -> dict:
    """Normalise a create_agent result into {reply, interrupted}."""
    interrupts = result.get("__interrupt__") or []
    if interrupts:
        payload = interrupts[0].value
        question = payload.get("question") if isinstance(payload, dict) else str(payload)
        _set_pending_thread(session_id, thread)
        return {"reply": question, "interrupted": True}

    _clear_pending_thread(session_id)
    last = result["messages"][-1] if result.get("messages") else None
    if last is None:
        return {"reply": "I could not produce a reply.", "interrupted": False}
    reply = content_text(last.content)
    return {"reply": reply, "interrupted": False}


def agent_turn(
    session_id: str,
    user_id: str,
    content: str,
    history: list[dict],
) -> dict:
    """Run (or resume) the agent for one user message in a chat session.

    Returns ``{"reply": str, "interrupted": bool}``. When ``interrupted`` is
    True the reply is a clarifying question the caller should persist as the
    assistant message; the next user message will resume this graph thread.
    """
    from app import tools as agent_tools

    graph = _agent_graph()
    token = agent_tools.set_request_context(_caller_context(user_id, session_id))
    try:
        pending = _pending_thread(session_id)
        if pending:
            cfg = {"configurable": {"thread_id": pending}}
            try:
                snap = graph.get_state(cfg)
            except Exception:  # noqa: BLE001
                snap = None
            if snap is not None and snap.tasks and snap.tasks[0].interrupts:
                result = graph.invoke(Command(resume=content), config=cfg)
                return _agent_result(session_id, pending, result)
            _clear_pending_thread(session_id)

        thread = uuid.uuid4().hex
        cfg = {"configurable": {"thread_id": thread}}
        history_messages = _history_messages(history)
        if history_messages:
            graph.update_state(cfg, {"messages": history_messages})
        result = graph.invoke({"messages": [HumanMessage(content=content)]}, config=cfg)
        return _agent_result(session_id, thread, result)
    finally:
        agent_tools.reset_request_context(token)