import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/lyzr-proxy", tags=["LYZR Proxy"])

LYZR_SESSION_URL = "https://agent-prod.studio.lyzr.ai/v1/sessions"
LYZR_API_KEY = os.getenv("LYZR_API_KEY", "")


@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Proxy the LYZR session history API to avoid CORS issues."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{LYZR_SESSION_URL}/{session_id}/history",
                headers={
                    "accept": "application/json",
                    "x-api-key": LYZR_API_KEY,
                },
            )

        if resp.status_code == 500:
            # 500 with "No messages found" means empty session
            return []

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        return data if isinstance(data, list) else []
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))
