#STANDARD IMPORTS
from typing import Optional
#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Query, Request, HTTPException

router = APIRouter(prefix="/api", tags=["Sensors"])

"""
Returns a list of samples for a specific sensor. Has several query parameters that can be used to fine-tune the results.

Query Parameters returned:

skipCopy link to skip
Type:integer
min:  
0
max:  
9007199254740991
default: 
0
required
The number of samples to skip before returning the first sample (used for pagination)

limitCopy link to limit
Type:integer
greater than:  
0
max:  
2000
default: 
60
required
The maximum number of samples to return (used for pagination)

beforeCopy link to before
Type:number
A timestamp to filter samples before a certain time, given in fractional unix epoch time

afterCopy link to after
Type:number
A timestamp to filter samples after a certain time, given in fractional unix epoch time

sortCopy link to sort
Type:string
enum
default: 
"desc"
required
The order to sort samples by timestamp

asc
desc
"""


@router.get("/sensors/sample/{sensor_id}")
async def query_sensor_sample(
    request: Request,
    sensor_id: int,
    skip: int = Query(
        0,
        ge=0,
        le=9007199254740991,
        description="Number of samples to skip (pagination)."
    ),
    limit: int = Query(
        60,
        gt=0,
        le=2000,
        description="Maximum number of samples to return (pagination)."
    ),
    before: Optional[float] = Query(
        None,
        description="Timestamp to filter samples before (fractional UNIX epoch)."
    ),
    after: Optional[float] = Query(
        None,
        description="Timestamp to filter samples after (fractional UNIX epoch)."
    ),
    sort: str = Query(
        "desc",
        regex="^(asc|desc)$",
        description="Order to sort samples by timestamp ('asc' or 'desc')."
    ),
):
    """
    Returns a list of samples for a specific sensor with filtering and pagination.
    """

    s = request.app.state.settings
    url = f"https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/sensors/{sensor_id}/samples"

    headers = {
        "Authorization": f"Bearer {s.KV_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Prepare query params based on input
    params = {
        "skip": skip,
        "limit": limit,
        "sort": sort
    }

    if before is not None:
        params["before"] = before
    if after is not None:
        params["after"] = after

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers, params=params) as resp:
            content = await resp.text()

            if resp.status != 200:
                raise HTTPException(
                    status_code=resp.status,
                    detail=f"Query sensor samples failed: ({resp.status}): {content}"
                )

            try:
                data = await resp.json()
            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse JSON: {content}"
                )

            return data