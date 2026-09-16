import io
from functools import lru_cache

from fastapi import HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

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
def _embedder() -> OllamaEmbeddings:
    return OllamaEmbeddings(
        model=settings.embedding_model, base_url=settings.ollama_base_url
    )


@lru_cache
def _chat_model() -> ChatGroq:
    return ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0.2,
        max_tokens=1024,
    )


def embedding_vector(text: str) -> str:
    """Return the 384-dim embedding of `text` as a Postgres vector literal string."""
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


def generate_reply(history: list[dict], context: str, reference: str = "") -> str:
    messages = build_messages(history, context, reference)
    response = _chat_model().invoke(messages)
    return response.content if isinstance(response.content, str) else str(response.content)