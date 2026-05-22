"""Photo processing endpoints"""
import os
import logging
import httpx
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from services import supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


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


class ProcessPhotoRequest(BaseModel):
    photoId: str
    imageUrl: str
    surveyId: str
    personId: str
    slotIndex: int


class ProcessPhotoResponse(BaseModel):
    photoId: str
    processedUrl: str
    thumbnailUrl: str
    validation: dict
    metadata: dict
    success: bool
    message: str = ""


@router.post("/process-photo", response_model=ProcessPhotoResponse)
async def process_photo(
    request: Request,
    payload: ProcessPhotoRequest,
    background_tasks: BackgroundTasks,
):
    """
    Full AI face processing pipeline:
    1. Download original image
    2. Run InsightFace detection + alignment
    3. Crop, resize to 512x512 WEBP
    4. Generate thumbnail 128x128 WEBP
    5. Upload to Firebase Storage
    6. Update Firestore document
    """
    face_processor = request.app.state.face_processor

    # Download image
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(payload.imageUrl)
            resp.raise_for_status()
            image_data = resp.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {e}")

    # Process
    result = await face_processor.process_image(image_data)

    validation = {
        "hasFace": result["hasFace"],
        "faceCount": result["faceCount"],
        "isBlurry": result["isBlurry"],
        "isLowResolution": result["isLowResolution"],
        "confidence": result["confidence"],
        "warnings": result["warnings"],
        "faceEmbedding": result.get("faceEmbedding"),
    }

    metadata = {
        "width": result["width"],
        "height": result["height"],
        "format": "webp",
        "fileSize": len(result.get("processedImage") or b""),
    }

    # Upload to storage
    processed_path = f"surveys/{payload.surveyId}/processed/{payload.photoId}_512.webp"
    thumbnail_path = f"surveys/{payload.surveyId}/thumbnails/{payload.photoId}_128.webp"

    processed_url = ""
    thumbnail_url = ""

    if result.get("processedImage"):
        if supabase_service.get_client() is not None:
            processed_url = supabase_service.upload_image_bytes(
                result["processedImage"],
                processed_path,
                content_type="image/webp",
            )

    if result.get("thumbnailImage"):
        if supabase_service.get_client() is not None:
            thumbnail_url = supabase_service.upload_image_bytes(
                result["thumbnailImage"],
                thumbnail_path,
                content_type="image/webp",
            )

    # Update Firestore
    update_data = {
        "processed_url": processed_url,
        "thumbnail_url": thumbnail_url,
        "ai_validation": {k: v for k, v in validation.items() if k != "faceEmbedding"},
        "face_embedding": validation.get("faceEmbedding"),
        "metadata": metadata,
        "status": "approved" if validation["hasFace"] and validation["faceCount"] == 1 else "rejected",
    }
    background_tasks.add_task(supabase_service.update_photo_record, payload.photoId, update_data)

    logger.info(f"Processed photo {payload.photoId}: face={result['hasFace']}, count={result['faceCount']}")

    return ProcessPhotoResponse(
        photoId=payload.photoId,
        processedUrl=processed_url,
        thumbnailUrl=thumbnail_url,
        validation=validation,
        metadata=metadata,
        success=True,
    )


@router.post("/reprocess-photo")
async def reprocess_photo(request: Request, payload: ProcessPhotoRequest):
    """Re-run AI processing on an existing photo"""
    return await process_photo(request, payload, BackgroundTasks())
