"""Health check endpoints"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from datetime import datetime
from services.supabase_service import set_user_role_by_email

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    faceProcessorReady: bool
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    fp = getattr(request.app.state, "face_processor", None)
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat(),
        faceProcessorReady=fp is not None and fp.initialized,
        version="1.0.0",
    )


@router.post("/admin/set-role")
async def set_admin_role(email: str):
    """Set admin role for a user - development only"""
    try:
        ok = set_user_role_by_email(email, "admin")
        if not ok:
            return {
                "success": False,
                "error": "User not found or Supabase not configured",
            }
        return {
            "success": True,
            "message": f"Admin role set for {email}",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
