#THIRD PARTY IMPORTS
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["System"])

@router.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <html>
        <head>
            <title>PIberDash API</title>
            <link rel="icon" type="image/x-icon" href=/favicon.ico>
        </head>
        <body>
            <h1>API is running!</h1>
            <p>Visit <a href="/docs">/docs</a> for interactive API docs (Swagger UI).</p>
            <p>Visit <a href="/redoc">/redoc</a> for alternative API docs (ReDoc).</p>
        </body>
    </html>
    """