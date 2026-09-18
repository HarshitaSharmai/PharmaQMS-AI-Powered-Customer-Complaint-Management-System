"""
LangGraph orchestration for the Complaint Intake AI pipeline.

Graph shape:

    extract_fields
          |
    completeness_check
          |
    duplicate_check
          |
    risk_classify
          |
     (conditional)
      branch A        branch B
 root_cause      [skip - Minor severity]
     |                    |
 capa_recommend           |
      (both branches join)
       summarize
          |
    compose_message
          |
         END

The conditional edge demonstrates that root-cause / CAPA analysis (the more
expensive, reasoning-heavy LLM calls on llama-3.3-70b-versatile) is only
triggered for Major/Critical risk complaints, mirroring how a real QA triage
workflow would prioritise investigative effort.
"""
from typing import TypedDict, List, Dict, Any, Optional

from langgraph.graph import StateGraph, END

from app.agents.groq_client import groq_client
from app.agents.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    COMPLETENESS_SYSTEM_PROMPT,
    RISK_CLASSIFICATION_SYSTEM_PROMPT,
    ROOT_CAUSE_SYSTEM_PROMPT,
    CAPA_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT,
    DUPLICATE_CHECK_SYSTEM_PROMPT,
)
from app.agents.utils import safe_json_parse
from app.config import get_settings

settings = get_settings()


class ComplaintAgentState(TypedDict, total=False):
    raw_text: str
    existing_complaints: List[Dict[str, Any]]

    fields: Dict[str, Any]
    completeness_score: int
    missing_fields: List[str]

    duplicates: List[Dict[str, Any]]

    risk_classification: Optional[str]
    risk_rationale: Optional[str]

    root_cause_suggestions: List[str]
    capa_recommendations: List[str]

    summary: Optional[str]
    assistant_message: str


# ---------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------
def node_extract_fields(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        EXTRACTION_SYSTEM_PROMPT,
        state["raw_text"],
        model=settings.groq_fast_model,
        json_mode=True,
        temperature=0.0,
    )
    fields = safe_json_parse(raw)
    return {"fields": fields}


def node_completeness_check(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        COMPLETENESS_SYSTEM_PROMPT,
        f"Fields: {state.get('fields', {})}",
        model=settings.groq_fast_model,
        json_mode=True,
    )
    data = safe_json_parse(raw)
    return {
        "completeness_score": int(data.get("score", 0) or 0),
        "missing_fields": data.get("missing_fields", []) or [],
    }


def node_duplicate_check(state: ComplaintAgentState) -> ComplaintAgentState:
    existing = state.get("existing_complaints", [])
    if not existing:
        return {"duplicates": []}

    fields = state.get("fields", {})
    prompt = (
        f"NEW complaint fields: {fields}\n\n"
        f"EXISTING complaints: {existing}"
    )
    raw = groq_client.chat(
        DUPLICATE_CHECK_SYSTEM_PROMPT,
        prompt,
        model=settings.groq_fast_model,
        json_mode=True,
    )
    data = safe_json_parse(raw)
    dupes = [d for d in data.get("duplicates", []) if d.get("score", 0) >= settings.duplicate_similarity_threshold]
    return {"duplicates": dupes}


def node_risk_classify(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        RISK_CLASSIFICATION_SYSTEM_PROMPT,
        f"Complaint fields: {state.get('fields', {})}",
        model=settings.groq_fast_model,
        json_mode=True,
    )
    data = safe_json_parse(raw)
    return {
        "risk_classification": data.get("classification"),
        "risk_rationale": data.get("rationale"),
    }


def route_after_risk(state: ComplaintAgentState) -> str:
    """Only run the expensive RCA/CAPA reasoning chain for Major/Critical risk."""
    if state.get("risk_classification") in ("Major", "Critical"):
        return "root_cause"
    return "summarize"


def node_root_cause(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        ROOT_CAUSE_SYSTEM_PROMPT,
        f"Complaint fields: {state.get('fields', {})}",
        model=settings.groq_context_model,
        json_mode=True,
        temperature=0.4,
    )
    data = safe_json_parse(raw)
    return {"root_cause_suggestions": data.get("suggestions", []) or []}


def node_capa_recommend(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        CAPA_SYSTEM_PROMPT,
        f"Complaint fields: {state.get('fields', {})}\n"
        f"Root causes: {state.get('root_cause_suggestions', [])}",
        model=settings.groq_context_model,
        json_mode=True,
        temperature=0.3,
    )
    data = safe_json_parse(raw)
    return {"capa_recommendations": data.get("recommendations", []) or []}


def node_summarize(state: ComplaintAgentState) -> ComplaintAgentState:
    raw = groq_client.chat(
        SUMMARY_SYSTEM_PROMPT,
        f"Complaint fields: {state.get('fields', {})}",
        model=settings.groq_fast_model,
        json_mode=True,
    )
    data = safe_json_parse(raw)
    return {"summary": data.get("summary")}


def node_compose_message(state: ComplaintAgentState) -> ComplaintAgentState:
    score = state.get("completeness_score", 0)
    missing = state.get("missing_fields", [])
    risk = state.get("risk_classification")
    dupes = state.get("duplicates", [])

    lines = ["I've analyzed the complaint document and populated the form."]
    lines.append(f"Completeness: {score}%.")
    if missing:
        lines.append(f"Still missing: {', '.join(missing)}.")
    if risk:
        lines.append(f"Preliminary AI risk classification: {risk}.")
    if dupes:
        lines.append(f"⚠️ Possible duplicate of {len(dupes)} existing complaint(s) - please review.")
    lines.append("You can edit any field before saving, or ask me anything about this complaint.")
    return {"assistant_message": " ".join(lines)}


# ---------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------
def build_graph():
    graph = StateGraph(ComplaintAgentState)

    graph.add_node("extract_fields", node_extract_fields)
    graph.add_node("completeness_check", node_completeness_check)
    graph.add_node("duplicate_check", node_duplicate_check)
    graph.add_node("risk_classify", node_risk_classify)
    graph.add_node("root_cause", node_root_cause)
    graph.add_node("capa_recommend", node_capa_recommend)
    graph.add_node("summarize", node_summarize)
    graph.add_node("compose_message", node_compose_message)

    graph.set_entry_point("extract_fields")
    graph.add_edge("extract_fields", "completeness_check")
    graph.add_edge("completeness_check", "duplicate_check")
    graph.add_edge("duplicate_check", "risk_classify")

    graph.add_conditional_edges(
        "risk_classify",
        route_after_risk,
        {"root_cause": "root_cause", "summarize": "summarize"},
    )
    graph.add_edge("root_cause", "capa_recommend")
    graph.add_edge("capa_recommend", "summarize")
    graph.add_edge("summarize", "compose_message")
    graph.add_edge("compose_message", END)

    return graph.compile()


complaint_agent_graph = build_graph()
