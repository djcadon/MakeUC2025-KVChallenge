#STANDARD IMPORTS
from typing import Optional
#THIRD PARTY IMPORTS
import aiohttp
from aiohttp import ClientTimeout, TCPConnector
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
    Reuses a shared aiohttp.ClientSession in request.app.state.http_session and
    enforces a connector limit to avoid exhausting system resources.
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

    # Ensure a shared session exists on app.state to avoid creating many sessions.
    session = getattr(request.app.state, "http_session", None)
    if session is None or session.closed:
        # configure connector limits and timeout
        connector = TCPConnector(limit=50, limit_per_host=25)  # tune limits to your env
        timeout = ClientTimeout(total=15)  # 15s total timeout
        request.app.state.http_session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        session = request.app.state.http_session

    try:
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
    except aiohttp.ClientError as e:
        # translate aiohttp network errors into HTTPException for visibility
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(e)}")