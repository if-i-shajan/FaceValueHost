"""Photo upload endpoints with lightweight face detection"""
import os
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import cv2
import numpy as np
from PIL import Image
from services import supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Create uploads directory if it doesn't exist
# Navigate to project root: routers/../ = backend-ai
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def detect_faces_opencv(image: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Detect faces using OpenCV Haar cascade."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
    return faces if len(faces) > 0 else []


class ProcessPhotoRequest(BaseModel):
    photoId: str
    imageUrl: str
    surveyId: str
    personId: str
    slotIndex: int


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    photoId: str = Form(...),
    surveyId: str = Form(...),
):
    """
    Handle photo upload from frontend.
    Saves file to backend storage and returns accessible URL.
    """
    try:
        # Save uploaded file
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            raise HTTPException(status_code=400, detail="Invalid file type. Use JPG, PNG, or WEBP.")
        
        contents = await file.read()

        # Prefer Supabase storage
        if supabase_service.get_client() is not None:
            storage_path = f"surveys/{surveyId}/originals/{photoId}{file_ext}"
            try:
                photo_url = supabase_service.upload_image_bytes(
                    contents,
                    storage_path,
                    content_type=file.content_type or "image/jpeg",
                )
            except Exception as e:
                logger.error(f"Supabase upload failed: {e}")
                raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

            return {
                "success": True,
                "photoId": photoId,
                "photoUrl": photo_url,
                "fileSize": len(contents),
            }

        # Local fallback
        survey_dir = UPLOADS_DIR / surveyId / "originals"
        survey_dir.mkdir(parents=True, exist_ok=True)

        file_path = survey_dir / f"{photoId}{file_ext}"
        with open(file_path, "wb") as f:
            f.write(contents)

        logger.info(f"Uploaded photo {photoId} to {file_path}")

        photo_url = f"/uploads/{surveyId}/originals/{photoId}{file_ext}"

        return {
            "success": True,
            "photoId": photoId,
            "photoUrl": photo_url,
            "fileSize": len(contents),
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/process-photo")
async def process_photo(payload: ProcessPhotoRequest):
    """
    Process photo with real face detection using MediaPipe
    Returns validation results and face detection data
    """
    try:
        # Parse the image URL to find the local file
        url_parts = payload.imageUrl.strip('/').split('/')
        if len(url_parts) >= 3:
            survey_id = url_parts[1]
            folder = url_parts[2]
            filename = '/'.join(url_parts[3:])
        else:
            raise ValueError(f"Invalid image URL format: {payload.imageUrl}")
        
        file_path = UPLOADS_DIR / survey_id / folder / filename
        
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return {
                "photoId": payload.photoId,
                "processedUrl": payload.imageUrl,
                "thumbnailUrl": payload.imageUrl,
                "validation": {
                    "hasFace": False,
                    "faceCount": 0,
                    "isBlurry": False,
                    "isLowResolution": False,
                    "confidence": 0.0,
                    "warnings": ["Image file not found"],
                },
                "metadata": {"width": 0, "height": 0, "format": "unknown", "fileSize": 0},
                "success": False,
            }
        
        # Load and process image
        image = cv2.imread(str(file_path))
        if image is None:
            logger.error(f"Failed to read image: {file_path}")
            return {
                "photoId": payload.photoId,
                "processedUrl": payload.imageUrl,
                "thumbnailUrl": payload.imageUrl,
                "validation": {
                    "hasFace": False,
                    "faceCount": 0,
                    "isBlurry": False,
                    "isLowResolution": False,
                    "confidence": 0.0,
                    "warnings": ["Invalid image format"],
                },
                "metadata": {"width": 0, "height": 0, "format": "unknown", "fileSize": 0},
                "success": False,
            }
        
        height, width = image.shape[:2]
        
        # Detect faces using OpenCV Haar cascade
        faces = detect_faces_opencv(image)
        face_count = len(faces)
        confidence = 0.85 if face_count > 0 else 0.0
        warnings = []

        if face_count > 0:
            logger.info(f"Photo {payload.photoId}: Detected {face_count} face(s) with confidence {confidence:.2f}")
        else:
            warnings.append("No face detected in image")
            logger.warning(f"Photo {payload.photoId}: No face detected")
        
        # Check image quality
        is_blurry = False
        is_low_resolution = False
        
        # Check resolution
        if width < 200 or height < 200:
            is_low_resolution = True
            warnings.append(f"Low resolution: {width}x{height}")
        
        # Check blur using Laplacian variance
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:  # Threshold for blur detection
            is_blurry = True
            warnings.append("Image appears blurry")
        
        # Return validation results
        has_face = face_count == 1  # Approve only if exactly 1 face
        status = "approved" if has_face else "rejected"
        
        return {
            "photoId": payload.photoId,
            "processedUrl": payload.imageUrl,
            "thumbnailUrl": payload.imageUrl,
            "validation": {
                "hasFace": has_face,
                "faceCount": face_count,
                "isBlurry": is_blurry,
                "isLowResolution": is_low_resolution,
                "confidence": confidence,
                "warnings": warnings,
            },
            "metadata": {
                "width": width,
                "height": height,
                "format": file_path.suffix.lstrip('.'),
                "fileSize": file_path.stat().st_size,
            },
            "status": status,
            "success": True,
        }
    except Exception as e:
        logger.error(f"Process photo failed: {e}")
        return {
            "photoId": payload.photoId,
            "processedUrl": payload.imageUrl,
            "thumbnailUrl": payload.imageUrl,
            "validation": {
                "hasFace": False,
                "faceCount": 0,
                "isBlurry": False,
                "isLowResolution": False,
                "confidence": 0.0,
                "warnings": [str(e)],
            },
            "metadata": {"width": 0, "height": 0, "format": "unknown", "fileSize": 0},
            "success": False,
        }


@router.delete("/delete-photo/{photoId}")
async def delete_photo(photoId: str):
    """
    Delete a photo from backend storage.
    """
    try:
        deleted_any = False

        # Supabase storage deletion via photo record URLs
        if supabase_service.get_client() is not None:
            record = supabase_service.get_photo_record(photoId)
            if record:
                bucket = supabase_service.get_bucket()
                marker = f"/storage/v1/object/public/{bucket}/"
                paths = []
                for url_key in ("original_url", "processed_url", "thumbnail_url"):
                    url = record.get(url_key)
                    if isinstance(url, str) and marker in url:
                        paths.append(url.split(marker, 1)[1])
                if paths:
                    supabase_service.remove_storage_paths(paths)
                    deleted_any = True

        # Local fallback deletion
        for survey_dir in UPLOADS_DIR.rglob("*"):
            if survey_dir.is_file() and photoId in survey_dir.name:
                survey_dir.unlink()
                deleted_any = True
                logger.info(f"Deleted photo {photoId} from local storage")
                break

        if not deleted_any:
            logger.warning(f"Photo {photoId} not found for deletion")

        return {"success": True, "photoId": photoId}
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
