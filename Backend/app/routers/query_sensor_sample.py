#STANDARD IMPORTS
from datetime import datetime, timezone
#THIRD PARTY IMPORTS
import aiohttp
from fastapi import APIRouter, Request, HTTPException
#LOCAL IMPORTS

router = APIRouter(prefix="/api", tags=["CDW"])

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


@router.get("/sensors/sample")
async def query_sensor_sample(request: Request, sensor_id: int):
    s = request.app.state.settings
    print(s.KV_API_TOKEN)
    url = f"https://makeuc2025.kv.k8s.kinetic-vision.com/api/v1/sensors/{sensor_id}/samples"
    
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