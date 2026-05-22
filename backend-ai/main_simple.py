"""
Simplified FaceRater Backend - Photo Upload Service
Handles photo uploads without AI processing (use for testing/MVP)
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Import only the simple routers (no InsightFace)
from routers import photo_router_simple, health_router_simple
from services.supabase_service import init_supabase

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    logger.info("Starting Simplified FaceRater Backend...")
    init_supabase()
    logger.info("Photo upload service ready (AI processing disabled)")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="FaceRater API (Simple)",
    description="Photo upload service for FaceRating Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Setup uploads directory
# Both main.py and routers use backend-ai/uploads
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

# Make sure routers can find the uploads too
from routers import photo_router_simple as photo_router
photo_router.UPLOADS_DIR = uploads_dir


# Custom route to serve uploads with proper CORS headers
@app.get("/uploads/{survey_id}/{folder}/{filename}")
async def serve_upload(survey_id: str, folder: str, filename: str):
    """Serve uploaded files with explicit CORS headers"""
    file_path = uploads_dir / survey_id / folder / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "public, max-age=3600",
        }
    )


# Routers - only health and photo upload (no AI processing)
app.include_router(health_router_simple.router, prefix="/api", tags=["Health"])
app.include_router(photo_router_simple.router, prefix="/api", tags=["Photos"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development",
        workers=1,
    )
