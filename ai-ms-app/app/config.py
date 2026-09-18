import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    google_chat_model: str = os.getenv("GOOGLE_CHAT_MODEL", "gemini-2.0-flash")
    google_embedding_model: str = os.getenv("GOOGLE_EMBEDDING_MODEL", "gemini-embedding-001")
    chat_history_limit: int = int(os.getenv("CHAT_HISTORY_LIMIT", "20"))
    rag_match_count: int = int(os.getenv("RAG_MATCH_COUNT", "3"))
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    generated_files_dir: str = os.getenv("GENERATED_FILES_DIR", "/tmp/yope_generated")


settings = Settings()