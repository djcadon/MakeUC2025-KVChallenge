#STANDARD IMPORTS
from typing import Any
#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Body, Request, HTTPException

router = APIRouter(prefix="/api", tags=["Actuators"])

@router.get("/actuator/{actuator_id}")
async def get_actuator_by_id(request: Request, actuator_id: int):
    s = request.app.state.settings
    print(s.KV_API_TOKEN)
    url = f"https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/actuators/{actuator_id}"
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


# Sets the current state of an actuator.

@router.put("/actuator/{actuator_id}", response_model=None)
async def set_actuator_by_id(
    request: Request,
    actuator_id: int,
    value: Any = Body(..., description="Raw value to set for the actuator (e.g. number, boolean, string)"),
):
    """
    Updates the state of an actuator by sending a PUT request to the upstream API.
    The body should be the *raw JSON value*, not wrapped in an object.
    """
    s = request.app.state.settings
    url = f"https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/actuators/{actuator_id}/state"

    headers = {
        "Authorization": f"Bearer {s.KV_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Send the raw value as JSON (not wrapped in an object)
    async with aiohttp.ClientSession() as session:
        async with session.put(url, headers=headers, json=value) as resp:
            content = await resp.text()

            if resp.status != 200:
                raise HTTPException(
                    status_code=resp.status,
                    detail=f"Set actuator failed: ({resp.status}): {content}"
                )

            try:
                data = await resp.json()
            except Exception:
                # In case upstream returns plain text or empty body
                return {"status": resp.status, "content": content}

            return data