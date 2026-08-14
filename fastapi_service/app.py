import csv
import io
import os
from collections import Counter
from datetime import datetime
from typing import Literal

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Cyberdog Automation API", docs_url=None, redoc_url=None, openapi_url=None)
MAX_EVENTS = 2_000
MAX_ROWS = 5_000


def require_internal_token(x_cyberdog_internal_token: str | None = Header(default=None)):
    expected = os.environ.get("FASTAPI_INTERNAL_TOKEN")
    if not expected or x_cyberdog_internal_token != expected:
        raise HTTPException(status_code=401, detail="Internal service authentication failed")


class AnalyticsEvent(BaseModel):
    event_type: str = Field(min_length=1, max_length=120)
    occurred_at: datetime | None = None


class AnalyticsRequest(BaseModel):
    events: list[AnalyticsEvent] = Field(max_length=MAX_EVENTS)


class ImportPreviewRequest(BaseModel):
    format: Literal["csv", "json"]
    content: str = Field(min_length=2, max_length=2_000_000)
    allowed_columns: list[str] = Field(min_length=1, max_length=80)


class BriefRequest(BaseModel):
    prompt: str = Field(min_length=12, max_length=2_200)


@app.get("/health", dependencies=[Depends(require_internal_token)])
async def health():
    return {"status": "ready", "service": "cyberdog-fastapi"}


@app.post("/analytics/summarize", dependencies=[Depends(require_internal_token)])
async def summarize_analytics(request: AnalyticsRequest):
    counter = Counter(event.event_type.strip().lower() for event in request.events)
    return {
        "event_count": len(request.events),
        "unique_event_types": len(counter),
        "top_events": [{"event_type": name, "count": count} for name, count in counter.most_common(12)],
        "note": "This endpoint processes supplied aggregate events only; it does not infer individual identities or inspect private messages.",
    }


@app.post("/data/import-preview", dependencies=[Depends(require_internal_token)])
async def import_preview(request: ImportPreviewRequest):
    allowed = {column.strip() for column in request.allowed_columns if column.strip()}
    if request.format == "json":
        import json
        try:
            payload = json.loads(request.content)
        except json.JSONDecodeError as error:
            raise HTTPException(status_code=422, detail=f"Invalid JSON: {error.msg}") from error
        rows = payload if isinstance(payload, list) else [payload]
        if not all(isinstance(row, dict) for row in rows):
            raise HTTPException(status_code=422, detail="JSON imports must be an object or an array of objects")
        columns = sorted({key for row in rows for key in row.keys()})
    else:
        try:
            reader = csv.DictReader(io.StringIO(request.content))
            rows = list(reader)
            columns = reader.fieldnames or []
        except csv.Error as error:
            raise HTTPException(status_code=422, detail=f"Invalid CSV: {error}") from error
    if len(rows) > MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"Imports are limited to {MAX_ROWS} rows per request")
    unsupported = sorted(set(columns) - allowed)
    return {
        "format": request.format,
        "row_count": len(rows),
        "columns": columns,
        "unsupported_columns": unsupported,
        "accepted": not unsupported,
        "note": "Preview only. No records are written until an owner-approved import workflow is implemented.",
    }


@app.post("/ai/brief", dependencies=[Depends(require_internal_token)])
async def ai_brief(request: BriefRequest):
    forge_url = os.environ.get("BUILT_IN_FORGE_API_URL", "https://forge.manus.im").rstrip("/") + "/v1/chat/completions"
    forge_key = os.environ.get("BUILT_IN_FORGE_API_KEY")
    if not forge_key:
        raise HTTPException(status_code=503, detail="AI provider is not configured")
    payload = {
        "model": "gpt-5-mini",
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": "You are Cyberdog Automation. Produce a concise operational brief with Objective, Inputs, Automation Steps, Review Gate, and Risks. Never claim access to private messages, hidden member data, or external systems."},
            {"role": "user", "content": request.prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(forge_url, headers={"authorization": f"Bearer {forge_key}", "content-type": "application/json"}, json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="AI provider request failed")
    content = response.json().get("choices", [{}])[0].get("message", {}).get("content")
    return {"content": content if isinstance(content, str) else "Automation brief unavailable."}
