import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, DateTime, Float, Integer, JSON, Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class ComplaintStatus(str, enum.Enum):
    PENDING_TRIAGE = "Pending Triage"
    UNDER_INVESTIGATION = "Under Investigation"
    CAPA_INITIATED = "CAPA Initiated"
    CLOSED = "Closed"


class Severity(str, enum.Enum):
    CRITICAL = "Critical"
    MAJOR = "Major"
    MINOR = "Minor"


class Priority(str, enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Complaint(Base):
    """
    Core complaint record. Mirrors the 4 sections of the reference UI:
      1. Origin & Customer Details
      2. Product & Batch Identification
      3. Complaint Details
      4. Initial Assessment & Priority
    Plus the AI-generated fields produced by the LangGraph agent pipeline.
    """
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.PENDING_TRIAGE)

    # 1. Origin & customer details
    complaint_source = Column(String(120))
    customer_name = Column(String(200))

    # 2. Product & batch identification
    product_name = Column(String(200))
    product_strength_grade = Column(String(120))
    batch_lot_number = Column(String(120))
    manufacturing_date = Column(String(40))
    expiry_date = Column(String(40))
    quantity_affected = Column(String(60))
    quantity_unit = Column(String(20), default="kg")

    # 3. Complaint details
    complaint_type = Column(String(120))
    complaint_date = Column(String(40))
    detailed_description = Column(Text)

    # 4. Initial assessment & priority
    initial_severity = Column(SAEnum(Severity), nullable=True)
    priority = Column(SAEnum(Priority), nullable=True)

    # --- AI-derived fields (bonus features) ----------------------------
    completeness_score = Column(Integer, nullable=True)          # 0-100
    missing_fields = Column(JSON, nullable=True)                 # list[str]
    ai_risk_classification = Column(String(40), nullable=True)   # Critical/Major/Minor
    ai_risk_rationale = Column(Text, nullable=True)
    root_cause_suggestions = Column(JSON, nullable=True)         # list[str]
    capa_recommendations = Column(JSON, nullable=True)           # list[str]
    ai_summary = Column(Text, nullable=True)
    duplicate_of = Column(JSON, nullable=True)                   # list[{id, score, reason}]
    source_document_name = Column(String(255), nullable=True)
    raw_extracted_text = Column(Text, nullable=True)

    chat_messages = relationship("ChatMessage", back_populates="complaint", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=True)
    role = Column(String(20))  # "user" | "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="chat_messages")
