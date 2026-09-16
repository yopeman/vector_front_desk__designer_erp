import uvicorn
from fastapi import FastAPI

from app.routes import router

app = FastAPI(
    title="Vector AI Assistant API",
    description="AI chat sessions, messages and document attachments with "
    "Groq-powered RAG for the Vector ERP.",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
)

app.include_router(router, prefix="/api/v1")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)