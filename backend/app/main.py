import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import complaints, ai_assistant

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="Pharma Complaint Management System API",
    description="AI-powered Customer Complaint Management System for API & FDF manufacturers.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(ai_assistant.router)


@app.on_event("startup")
def on_startup():
    # For the demo, tables are auto-created. In production use Alembic
    # migrations instead (see README).
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
