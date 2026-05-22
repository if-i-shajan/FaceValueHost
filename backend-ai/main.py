"""
FaceRater AI Processing Backend
FastAPI server for face detection, alignment, cropping, and similarity matching
"""

import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from routers import photo_router, similarity_router, health_router
from services.supabase_service import init_supabase
from services.face_processor import FaceProcessor

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global face processor instance
face_processor: FaceProcessor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global face_processor
    logger.info("Initializing FaceRater AI Backend...")

    # Init Supabase
    init_supabase()
    logger.info("Supabase initialized")

    # Init InsightFace processor
    face_processor = FaceProcessor()
    await face_processor.initialize()
    logger.info("Face processor ready")

    # Store in app state
    app.state.face_processor = face_processor

    yield

    logger.info("Shutting down...")


app = FastAPI(
    title="FaceRater AI API",
    description="AI-powered face processing pipeline for research platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static files
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Routers
app.include_router(health_router.router, prefix="/api", tags=["Health"])
app.include_router(photo_router.router, prefix="/api", tags=["Photos"])
app.include_router(similarity_router.router, prefix="/api", tags=["Similarity"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development",
        workers=1,
    )
