#STANDARD IMPORTS
from datetime import datetime, timezone
#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Request, HTTPException
#LOCAL IMPORTS

router = APIRouter(prefix="/api", tags=["CDW"])

@router.get("/all/actutators")
async def list_actutators(request: Request):
    s = request.app.state.settings
    print(s.KV_API_TOKEN)
    url = "https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/actuators/"
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