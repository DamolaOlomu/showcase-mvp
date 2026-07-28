"""
AI design analysis for Batch 2.

Sends a desktop viewport screenshot to a Claude vision model and asks it to
return structured metadata: category, style tags, dominant colors, a short
editorial description, and a suggested title. This is what turns a bare
screenshot into a pre-filled gallery listing for the designer to review.

Gracefully degrades: if ANTHROPIC_API_KEY isn't set, or the call fails for
any reason, we return an "unavailable" result instead of raising — capture
still works, the designer just fills in the details manually. This means
Batch 1's manual flow keeps working even before you've wired up an API key.
"""
import base64
import io
import json

from app.config import settings

CATEGORIES = [
    "SaaS", "Agency", "Portfolio", "E-commerce", "Fintech",
    "AI", "Architecture", "Fashion", "Startup", "Creative",
]

SYSTEM_PROMPT = f"""You are analyzing a screenshot of a website's homepage for \
a curated design gallery (similar to Awwwards). Look at the visual design — \
layout, typography, color, imagery, tone — and return ONLY a JSON object \
(no markdown fences, no prose before or after) with exactly these fields:

{{
  "title": "short descriptive listing title, e.g. 'Acme Studio — Creative Agency Website'",
  "category": "exactly one of: {', '.join(CATEGORIES)}",
  "style_tags": ["3 to 6 short lowercase tags describing the visual style, e.g. minimal, dark-mode, bold-typography, editorial, brutalist"],
  "colors": ["2 to 4 dominant hex color codes actually visible in the design, e.g. #111111"],
  "description": "one to two sentence editorial description written for a design showcase — describe the design itself, not marketing copy about the company",
  "moderation": "\"safe\" if this looks like a normal website homepage suitable for a public design gallery, or \"flagged\" if it appears to contain sexual content, graphic violence, hate symbols, or looks like it might not actually be a real website (e.g. an error page, a blank page, or unrelated content)",
  "moderation_reason": "if flagged, a short one-sentence reason a human moderator can quickly read; null if safe"
}}"""

FALLBACK_RESULT = {
    "title": None,
    "category": None,
    "style_tags": [],
    "colors": [],
    "description": None,
    "moderation_flag": None,
    "moderation_reason": None,
    "ai_available": False,
}


def _prepare_image(image_bytes: bytes) -> str:
    """Resize/compress to keep the vision call fast and cheap, return base64 JPEG."""
    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((1280, 1280))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def analyze_screenshot(image_bytes: bytes) -> dict:
    if not settings.anthropic_api_key:
        return dict(FALLBACK_RESULT)

    try:
        import anthropic

        b64 = _prepare_image(image_bytes)

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
                        },
                        {"type": "text", "text": "Analyze this website screenshot and return the JSON object."},
                    ],
                }
            ],
        )

        text = "".join(block.text for block in response.content if block.type == "text").strip()
        # Models occasionally wrap JSON in fences despite instructions; strip if present.
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)

        category = data.get("category")
        if category not in CATEGORIES:
            category = None

        moderation_flag = data.get("moderation")
        if moderation_flag not in ("safe", "flagged"):
            moderation_flag = None

        return {
            "title": data.get("title"),
            "category": category,
            "style_tags": [t.strip().lower() for t in data.get("style_tags", []) if t.strip()][:6],
            "colors": [c.strip() for c in data.get("colors", []) if c.strip()][:4],
            "description": data.get("description"),
            "moderation_flag": moderation_flag,
            "moderation_reason": data.get("moderation_reason") if moderation_flag == "flagged" else None,
            "ai_available": True,
        }
    except Exception:
        # Any failure (bad key, rate limit, malformed JSON, network error) —
        # degrade gracefully rather than blocking the submission flow.
        return dict(FALLBACK_RESULT)
