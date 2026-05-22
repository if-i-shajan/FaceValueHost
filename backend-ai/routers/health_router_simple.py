"""Simple health check endpoint"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat(),
        service="Photo Upload Service",
        version="1.0.0 (Simplified)",
    )
