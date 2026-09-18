from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.agents.graph import complaint_agent_graph
from app.models import Complaint
from app.schemas import ExtractionResult, ComplaintBase


def _existing_complaints_summary(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    rows = (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "product_name": c.product_name,
            "batch_lot_number": c.batch_lot_number,
            "complaint_type": c.complaint_type,
            "detailed_description": (c.detailed_description or "")[:300],
        }
        for c in rows
    ]


def run_extraction_pipeline(db: Session, raw_text: str) -> ExtractionResult:
    existing = _existing_complaints_summary(db)

    result_state = complaint_agent_graph.invoke(
        {"raw_text": raw_text, "existing_complaints": existing}
    )

    fields_dict = result_state.get("fields", {}) or {}
    # Only keep keys ComplaintBase understands
    valid_keys = set(ComplaintBase.model_fields.keys())
    clean_fields = {k: v for k, v in fields_dict.items() if k in valid_keys and v not in (None, "", "null")}

    return ExtractionResult(
        fields=ComplaintBase(**clean_fields),
        completeness_score=result_state.get("completeness_score", 0),
        missing_fields=result_state.get("missing_fields", []),
        ai_risk_classification=result_state.get("risk_classification"),
        ai_risk_rationale=result_state.get("risk_rationale"),
        root_cause_suggestions=result_state.get("root_cause_suggestions", []),
        capa_recommendations=result_state.get("capa_recommendations", []),
        ai_summary=result_state.get("summary"),
        duplicate_of=result_state.get("duplicates", []),
        raw_extracted_text=raw_text,
        assistant_message=result_state.get("assistant_message", "Extraction complete."),
    )
