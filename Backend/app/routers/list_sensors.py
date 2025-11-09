#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Sensors"])

@router.get("/all/sensors")
async def get_all_sensors(request: Request):
    s = request.app.state.settings
    url = "https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/sensors/"
    headers = {
        "Authorization": f"Bearer {s.KV_API_TOKEN}",
        "Content-Type": "application/json"
    }


    # Create http get request
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            content = await resp.text()

            # Raise external http errors
            if resp.status != 200:
                raise HTTPException(
                    status_code=resp.status,
                    detail=f"Get all sensors failed: ({resp.status}): {content}"
                )

            # Raise 500 if response can't be parsed
            try:
                data = await resp.json()
            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse JSON: {content}"
                )

            return data