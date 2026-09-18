"""
Lightweight document parsing - NOT production-grade OCR (per assignment spec,
that isn't required). Handles the formats shown in the reference UI:
PDF, DOCX, TXT, EML.
"""
import email
import io
from email import policy

from docx import Document as DocxDocument
from pypdf import PdfReader


def extract_text_from_bytes(filename: str, content: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return _extract_pdf(content)
    if ext == "docx":
        return _extract_docx(content)
    if ext == "eml":
        return _extract_eml(content)
    if ext == "txt":
        return content.decode("utf-8", errors="ignore")

    # Fallback: try plain-text decode
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _extract_pdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _extract_docx(content: bytes) -> str:
    doc = DocxDocument(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_eml(content: bytes) -> str:
    msg = email.message_from_bytes(content, policy=policy.default)
    parts = [f"Subject: {msg.get('subject', '')}", f"From: {msg.get('from', '')}", ""]
    body = msg.get_body(preferencelist=("plain", "html"))
    if body:
        parts.append(body.get_content())
    return "\n".join(parts)
