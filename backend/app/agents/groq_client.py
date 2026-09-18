"""
Thin wrapper around the Groq chat-completions API
(https://console.groq.com/docs/models).

Two models are used, per the assignment spec:
  - gemma2-9b-it              -> fast/cheap tasks (extraction, classification)
  - llama-3.3-70b-versatile   -> reasoning-heavy tasks (root cause, CAPA)

If no GROQ_API_KEY is configured (e.g. running the demo offline), the
client transparently falls back to a deterministic mock so the whole
pipeline still runs end-to-end for demonstration purposes.
"""
import json
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqClient:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = settings.groq_api_base

    @property
    def is_live(self) -> bool:
        return bool(self.api_key)

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.2,
    ) -> str:
        """Return the raw text content of the model's reply."""
        model = model or settings.groq_fast_model

        if not self.is_live:
            return self._mock_reply(system_prompt, user_prompt, json_mode)

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as exc:  # network issues, rate limit, bad key, etc.
            logger.warning("Groq API call failed (%s); falling back to mock.", exc)
            return self._mock_reply(system_prompt, user_prompt, json_mode)

    # ------------------------------------------------------------------
    # Offline fallback so the app is fully demoable without an API key.
    # It is intentionally simple: real intelligence comes from Groq when
    # a key is configured. This only guarantees the pipeline never breaks.
    # ------------------------------------------------------------------
    def _mock_reply(self, system_prompt: str, user_prompt: str, json_mode: bool) -> str:
        # NOTE: order matters - check the most specific/unique markers first,
        # since some prompts share vocabulary (e.g. the CAPA prompt also
        # mentions "root causes").
        sp = system_prompt.lower()
        if "extraction" in sp:
            tag = "extract"
        elif "capa" in sp:
            tag = "capa"
        elif "risk" in sp:
            tag = "risk"
        elif "root cause" in sp:
            tag = "root_cause"
        elif "completeness" in sp:
            tag = "completeness"
        elif "duplicate" in sp:
            tag = "duplicate"
        elif "summar" in sp:
            tag = "summary"
        else:
            tag = "chat"

        if not json_mode:
            return (
                "[MOCK LLM - no GROQ_API_KEY configured] "
                "I can see your message, but I'm running in offline demo mode. "
                "Set GROQ_API_KEY in backend/.env to get real answers."
            )

        # Very small heuristic "extraction" so the demo still populates fields.
        if tag == "extract":
            return json.dumps(self._heuristic_extract(user_prompt))
        if tag == "completeness":
            return json.dumps({"score": 60, "missing_fields": ["batch_lot_number", "expiry_date"]})
        if tag == "risk":
            return json.dumps({"classification": "Major", "rationale": "Offline mock classification."})
        if tag == "root_cause":
            return json.dumps({"suggestions": [
                "Possible raw material variability from supplier",
                "Potential deviation during granulation/blending step",
                "Packaging integrity failure during transit",
            ]})
        if tag == "capa":
            return json.dumps({"recommendations": [
                "Quarantine remaining batch stock pending investigation",
                "Review batch manufacturing record (BMR) for the affected lot",
                "Notify QA head and initiate formal CAPA per SOP-QA-014",
            ]})
        if tag == "summary":
            return json.dumps({"summary": "Offline mock summary: complaint received and pending detailed AI review."})
        if tag == "duplicate":
            return json.dumps({"duplicates": []})
        return json.dumps({})

    @staticmethod
    def _heuristic_extract(text: str) -> dict:
        import re
        out = {}
        patterns = {
            "batch_lot_number": r"(?:batch|lot)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9\-]{4,20})",
            "product_name": r"product\s*(?:name)?\s*[:\-]\s*([A-Za-z0-9 \-]{3,60})",
            "customer_name": r"(?:customer|client|from)\s*(?:name)?\s*[:\-]\s*([A-Za-z .]{3,60})",
            "manufacturing_date": r"(?:manufacturing|mfg)\s*date\s*[:\-]\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})",
            "expiry_date": r"expiry\s*date\s*[:\-]\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})",
        }
        for field, pat in patterns.items():
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                out[field] = m.group(1).strip()
        out["detailed_description"] = text[:500]
        return out


groq_client = GroqClient()
