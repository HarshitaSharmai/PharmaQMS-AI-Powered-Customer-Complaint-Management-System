from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict


class ComplaintBase(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None

    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    quantity_unit: Optional[str] = "kg"

    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    detailed_description: Optional[str] = None

    initial_severity: Optional[str] = None
    priority: Optional[str] = None

    source_document_name: Optional[str] = None
    raw_extracted_text: Optional[str] = None
    completeness_score: Optional[int] = None
    missing_fields: Optional[List[str]] = None
    ai_risk_classification: Optional[str] = None
    ai_risk_rationale: Optional[str] = None
    root_cause_suggestions: Optional[List[str]] = None
    capa_recommendations: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    duplicate_of: Optional[List[Dict[str, Any]]] = None


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(ComplaintBase):
    status: Optional[str] = None


class ComplaintOut(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
    status: str

    completeness_score: Optional[int] = None
    missing_fields: Optional[List[str]] = None
    ai_risk_classification: Optional[str] = None
    ai_risk_rationale: Optional[str] = None
    root_cause_suggestions: Optional[List[str]] = None
    capa_recommendations: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    duplicate_of: Optional[List[Dict[str, Any]]] = None
    source_document_name: Optional[str] = None


class ExtractionResult(BaseModel):
    """Everything the AI pipeline produces from a document / pasted text."""
    fields: ComplaintBase
    completeness_score: int
    missing_fields: List[str]
    ai_risk_classification: Optional[str] = None
    ai_risk_rationale: Optional[str] = None
    root_cause_suggestions: List[str] = []
    capa_recommendations: List[str] = []
    ai_summary: Optional[str] = None
    duplicate_of: List[Dict[str, Any]] = []
    raw_extracted_text: str
    assistant_message: str


class ChatRequest(BaseModel):
    complaint_id: Optional[str] = None
    message: str
    # current in-progress form state from the frontend, so the assistant
    # can answer questions like "what severity did you set?"
    current_fields: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
