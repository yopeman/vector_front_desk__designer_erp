from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app import ai
from app.config import settings
from app.db import db, require_session
from app.schemas import (
    Attachment,
    Chat,
    ChatCreate,
    ChatExchange,
    Session,
    SessionCreate,
    SessionUpdate,
)

router = APIRouter(prefix="/users/{user_id}")


def _first(data) -> dict:
    if isinstance(data, list) and data:
        return data[0]
    if isinstance(data, dict):
        return data
    return {}


def _norm(data) -> list[dict]:
    if isinstance(data, list):
        return data
    return [data] if isinstance(data, dict) else []


def _db_error(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=(
            f"Database error: {exc}. Make sure you have applied "
            "supabase_schema.sql to your Supabase project."
        ),
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@router.get("/sessions", response_model=list[Session])
def list_sessions(
    user_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    try:
        result = (
            db()
            .table("ai_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return result.data
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


@router.post("/sessions", response_model=Session, status_code=status.HTTP_201_CREATED)
def create_session(user_id: str, body: SessionCreate):
    payload = {
        "user_id": user_id,
        "title": (body.title or "").strip() or "New chat",
    }
    try:
        result = db().table("ai_sessions").insert(payload).execute()
        return _first(result.data)
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


@router.patch("/sessions/{session_id}", response_model=Session)
def update_session(user_id: str, session_id: str, body: SessionUpdate):
    require_session(session_id, user_id)
    try:
        result = (
            db()
            .table("ai_sessions")
            .update({"title": body.title.strip(), "updated_at": _now()})
            .eq("id", session_id)
            .execute()
        )
        return _first(result.data)
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


@router.delete(
    "/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_session(user_id: str, session_id: str):
    require_session(session_id, user_id)
    try:
        (
            db()
            .table("ai_sessions")
            .delete()
            .eq("id", session_id)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)
    return None


# ---------------------------------------------------------------------------
# Chats
# ---------------------------------------------------------------------------


@router.get("/sessions/{session_id}/chats", response_model=list[Chat])
def list_chats(user_id: str, session_id: str):
    require_session(session_id, user_id)
    try:
        result = (
            db()
            .table("ai_chats")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", asc=True)
            .execute()
        )
        return result.data
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


@router.post(
    "/sessions/{session_id}/chats", response_model=ChatExchange, status_code=status.HTTP_201_CREATED
)
def create_chat(user_id: str, session_id: str, body: ChatCreate):
    session = require_session(session_id, user_id)
    content = body.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message content must not be empty.",
        )

    try:
        user_row = _first(
            db()
            .table("ai_chats")
            .insert({"session_id": session_id, "role": "user", "content": content})
            .execute()
            .data
        )

        history = list(
            db()
            .table("ai_chats")
            .select("role", "content")
            .eq("session_id", session_id)
            .order("created_at", asc=True)
            .limit(settings.chat_history_limit)
            .execute()
            .data
        )

        context, reference = _retrieve_context(session_id, content)
        reply = ai.generate_reply(history, context, reference)

        assistant_row = _first(
            db()
            .table("ai_chats")
            .insert(
                {"session_id": session_id, "role": "assistant", "content": reply}
            )
            .execute()
            .data
        )

        updates: dict = {"updated_at": _now()}
        if session.get("title") in (None, "", "New chat"):
            updates["title"] = content[:60]
        db().table("ai_sessions").update(updates).eq("id", session_id).execute()

        return ChatExchange(user_message=user_row, assistant_message=assistant_row)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


# ---------------------------------------------------------------------------
# Attachments
# ---------------------------------------------------------------------------


@router.get("/sessions/{session_id}/attachments", response_model=list[Attachment])
def list_attachments(user_id: str, session_id: str):
    require_session(session_id, user_id)
    try:
        files = (
            db()
            .table("ai_attachments")
            .select("*, chunk_count:ai_attachment_chunks(count)")
            .eq("session_id", session_id)
            .order("created_at", asc=True)
            .execute()
            .data
        )
        return _decorate_chunks(files)
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


@router.post(
    "/sessions/{session_id}/attachments",
    response_model=Attachment,
    status_code=status.HTTP_201_CREATED,
)
def upload_attachment(user_id: str, session_id: str, file: UploadFile = File(...)):
    require_session(session_id, user_id)
    name = file.filename or "attachment"
    data = file.file.read()

    try:
        from app.ai import TEXT_EXTENSIONS

        if not any(name.lower().endswith(ext) for ext in TEXT_EXTENSIONS) and not any(
            name.lower().endswith(ext) for ext in (".pdf", ".docx")
        ):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    "Unsupported file type. Supported: " + ", ".join(sorted(TEXT_EXTENSIONS)) + ", .pdf, .docx"
                ),
            )

        text = ai.extract_text(name, data)
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable text could be extracted from the file.",
            )

        chunks = ai.chunk_text(text)
        embeddings = ai.embed_texts(chunks)

        file_row = _first(
            db()
            .table("ai_attachments")
            .insert(
                {
                    "session_id": session_id,
                    "name": name,
                    "mime_type": file.content_type,
                    "file_size": len(data),
                }
            )
            .execute()
            .data
        )

        chunk_rows = [
            {
                "attachment_id": file_row["id"],
                "chunk_index": i,
                "content": chunk,
                "embedding": "[" + ",".join(str(round(v, 6)) for v in emb) + "]",
            }
            for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
        ]
        if chunk_rows:
            db().table("ai_attachment_chunks").insert(chunk_rows).execute()

        file_row["chunk_count"] = len(chunk_rows)
        return file_row
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise _db_error(exc)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _retrieve_context(session_id: str, query: str) -> tuple[str, str]:
    """Find relevant attachment chunks for `query` via embedding search."""
    try:
        embedding = ai.embedding_vector(query)
        result = (
            db()
            .rpc(
                "match_ai_attachments",
                {
                    "session_uuid": session_id,
                    "query_embedding": embedding,
                    "match_count": settings.rag_match_count,
                },
            )
            .execute()
        )
        rows = _norm(result.data)
    except Exception:
        return "", ""
    if not rows:
        return "", ""

    context = "\n\n".join(
        f"[{row.get('file_name', 'attachment')}]\n{row.get('content', '')}" for row in rows
    )
    reference = ", ".join(
        f"{row.get('file_name', 'attachment')} ({row.get('similarity', 0):.0%} match)"
        for row in rows
    )
    return context, reference


def _decorate_chunks(files: list[dict]) -> list[Attachment]:
    """Normalise the nested count from the attachments list query."""
    decorated = []
    for f in files:
        chunk = f.pop("chunk_count", None)
        count = None
        if isinstance(chunk, list) and chunk:
            count = chunk[0].get("count")
        elif isinstance(chunk, dict):
            count = chunk.get("count")
        f["chunk_count"] = count
        decorated.append(Attachment(**f))
    return decorated