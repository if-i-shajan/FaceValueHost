"""Face similarity and duplicate detection endpoints"""
import logging
import numpy as np
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Tuple

logger = logging.getLogger(__name__)
router = APIRouter()


class FindSimilarRequest(BaseModel):
    photoId: str
    surveyId: str
    threshold: float = 0.65


class DetectDuplicatesRequest(BaseModel):
    surveyId: str
    threshold: float = 0.80


class SimilarPhoto(BaseModel):
    photoId: str
    similarity: float


class FindSimilarResponse(BaseModel):
    photoId: str
    similar: List[SimilarPhoto]


class DetectDuplicatesResponse(BaseModel):
    pairs: List[Tuple[str, str]]
    confidence: List[float]
    count: int


@router.post("/find-similar", response_model=FindSimilarResponse)
async def find_similar(request: Request, payload: FindSimilarRequest):
    """
    Find photos with similar faces using cosine similarity on embeddings.
    Retrieves embeddings from Firestore and computes pairwise similarity.
    """
    from services.firebase_service import get_db

    db = get_db()
    if db is None:
        return FindSimilarResponse(photoId=payload.photoId, similar=[])

    # Get target photo embedding
    target_doc = db.collection("photos").document(payload.photoId).get()
    if not target_doc.exists:
        raise HTTPException(404, "Photo not found")

    target_data = target_doc.to_dict()
    target_embedding = target_data.get("faceEmbedding")
    if not target_embedding:
        raise HTTPException(400, "No face embedding available for this photo")

    # Get all photos in survey with embeddings
    photos = db.collection("photos").where("surveyId", "==", payload.surveyId).stream()

    face_processor = request.app.state.face_processor
    similar = []

    for photo_doc in photos:
        if photo_doc.id == payload.photoId:
            continue
        photo_data = photo_doc.to_dict()
        emb = photo_data.get("faceEmbedding")
        if not emb:
            continue
        sim = face_processor.compute_similarity(target_embedding, emb)
        if sim >= payload.threshold:
            similar.append(SimilarPhoto(photoId=photo_doc.id, similarity=round(sim, 4)))

    similar.sort(key=lambda x: x.similarity, reverse=True)
    return FindSimilarResponse(photoId=payload.photoId, similar=similar[:10])


@router.post("/detect-duplicates", response_model=DetectDuplicatesResponse)
async def detect_duplicates(request: Request, payload: DetectDuplicatesRequest):
    """
    Scan all photos in survey for near-duplicate faces.
    Returns pairs of photo IDs with high similarity.
    """
    from services.firebase_service import get_db

    db = get_db()
    if db is None:
        return DetectDuplicatesResponse(pairs=[], confidence=[], count=0)

    photos = list(db.collection("photos").where("surveyId", "==", payload.surveyId).stream())
    photos_with_emb = [
        (p.id, p.to_dict().get("faceEmbedding"))
        for p in photos
        if p.to_dict().get("faceEmbedding")
    ]

    face_processor = request.app.state.face_processor
    pairs = []
    confidences = []

    for i in range(len(photos_with_emb)):
        for j in range(i + 1, len(photos_with_emb)):
            id_a, emb_a = photos_with_emb[i]
            id_b, emb_b = photos_with_emb[j]
            sim = face_processor.compute_similarity(emb_a, emb_b)
            if sim >= payload.threshold:
                pairs.append((id_a, id_b))
                confidences.append(round(sim, 4))

    logger.info(f"Found {len(pairs)} duplicate pairs in survey {payload.surveyId}")
    return DetectDuplicatesResponse(pairs=pairs, confidence=confidences, count=len(pairs))
