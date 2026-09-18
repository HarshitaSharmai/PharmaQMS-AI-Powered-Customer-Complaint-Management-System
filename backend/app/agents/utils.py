import json
import re


def safe_json_parse(raw: str) -> dict:
    """
    LLMs occasionally wrap JSON in markdown fences or add stray text.
    This strips that and parses defensively, returning {} on failure.
    """
    if not raw:
        return {}
    text = raw.strip()
    # strip ```json ... ``` or ``` ... ``` fences
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1)
    # grab the outermost {...} if there's leading/trailing prose
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        text = brace_match.group(0)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}
