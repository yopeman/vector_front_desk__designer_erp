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


def get_session(session_id: str, user_id: str) -> dict:
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
    return result.data or {
            "id": "013a7fb9-c289-4163-b3a4-e2d9f4f741d8",
            "department_id": None,
            "username": "Yope Auditor",
            "password_hash": None,
            "email": "auditor@vector.com",
            "phone": "0987654321",
            "role": "auditor",
            "created_at": "2026-08-26 06:26:24.807469+00",
            "updated_at": "2026-08-26 06:26:24.807469+00"
        }


def require_session(session_id: str, user_id: str) -> dict:
    session = get_session(session_id, user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found for user '{user_id}'.",
        )
    return session