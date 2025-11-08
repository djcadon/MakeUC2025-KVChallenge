#STANDARD IMPORTS
import importlib # For registering routers dynamically
import logging
import pkgutil # For registering routers dynamically
#THIRD PARTY IMPORTS
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
import uvicorn # Serves API
#LOCAL IMPORTS
from core.config import settings
from routers import __path__ as routers_path
from core.log import init_log

_logger = init_log("FastAPI.log")
logging.getLogger('asyncua').setLevel(logging.WARNING) # Suppress verbose asyncua logs
logging.getLogger('websockets.server').setLevel(logging.WARNING) # Suppress verbose websocket logs

# MAIN APP START
app = FastAPI(
    title = "KV BACKEND API", 
    version = "1.0",
    )

app.state.settings = settings

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],   # or restrict to ["GET", "POST"]
    allow_headers=["*"],   # or restrict to specific headers
)

# Register routers
for _, module_name, _ in pkgutil.iter_modules(routers_path):
    module = importlib.import_module(f"routers.{module_name}")
    if hasattr(module, "router"):
        app.include_router(module.router)
        _logger.debug(f"Registered router: {module_name}")
_logger.info("Registered routers")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)