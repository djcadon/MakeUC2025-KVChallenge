#STANDARD IMPORTS
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/api", tags=["CDW"])

@router.get("/token")
async def get_token(request: Request):
    # Import request settings
    s = request.app.state.settings 

    # Create http post request
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://makeuc2025.kv.k8s.kinetic-vision.com/api/auth/token",
            params={
            "team": "MemoryStackers"
            }) as resp:
            content = await resp.text()

            # Raise external http errors
            if resp.status != 200:
                raise HTTPException(
                    status_code=resp.status,
                    detail=f"Token request failed ({resp.status}): {content}"
                )

            # Raise 500 if response can't be parsed
            try:
                data = await resp.json()
            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse JSON: {content}"
                )

            # Set variables in app state
            request.app.state.token = data.get("token")
            request.app.state.token_expire = data.get("expiresAt")

            return {
                "token": request.app.state.token,
                "expiresAt": request.app.state.token_expire
            }