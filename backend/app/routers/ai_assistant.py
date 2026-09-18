from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas import ExtractionResult, ChatRequest, ChatResponse
from app.services.document_parser import extract_text_from_bytes
from app.services.extraction_service import run_extraction_pipeline
from app.services.chat_service import answer_chat_message

router = APIRouter(prefix="/api/ai", tags=["ai-assistant"])
settings = get_settings()


@router.post("/extract", response_model=ExtractionResult)
async def extract_complaint(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Accepts EITHER a document upload (PDF/DOCX/TXT/EML) OR pasted text,
    runs it through the LangGraph AI pipeline, and returns extracted
    fields plus all bonus-feature outputs (completeness, risk, root
    cause, CAPA, summary, duplicate detection).
    """
    if not file and not text:
        raise HTTPException(400, "Provide either a file or pasted text.")

    if file:
        content = await file.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.max_upload_mb:
            raise HTTPException(400, f"File exceeds {settings.max_upload_mb}MB limit.")
        raw_text = extract_text_from_bytes(file.filename, content)
    else:
        raw_text = text

    if not raw_text or not raw_text.strip():
        raise HTTPException(422, "Could not extract any text from the provided input.")

    result = run_extraction_pipeline(db, raw_text)
    return result


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    reply = answer_chat_message(payload.message, payload.current_fields)
    return ChatResponse(reply=reply)
