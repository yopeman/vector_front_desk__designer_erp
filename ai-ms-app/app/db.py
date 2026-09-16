from functools import lru_cache

from fastapi import HTTPException, status
from supabase import Client, create_client

from app.config import settings


@lru_cache
def db() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Supabase is not configured. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY in the .env file."
            ),
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_session(session_id: str, user_id: str) -> dict | None:
    """Fetch a session if it exists and belongs to the given user."""
    result = (
        db()
        .table("ai_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data or None


def require_session(session_id: str, user_id: str) -> dict:
    session = get_session(session_id, user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found for user '{user_id}'.",
        )
    return session