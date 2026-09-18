from typing import Optional, Dict, Any

from app.agents.groq_client import groq_client
from app.agents.prompts import CHAT_SYSTEM_PROMPT
from app.config import get_settings

settings = get_settings()


def answer_chat_message(message: str, current_fields: Optional[Dict[str, Any]] = None) -> str:
    context = f"\n\nCurrent form state: {current_fields}" if current_fields else ""
    return groq_client.chat(
        CHAT_SYSTEM_PROMPT,
        message + context,
        model=settings.groq_context_model,
        json_mode=False,
        temperature=0.4,
    )
