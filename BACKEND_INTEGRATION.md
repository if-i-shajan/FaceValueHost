# Backend Integration Guide

How to integrate Supabase database operations into your FastAPI backend and React frontend.

---

## 📝 Backend Integration

### File: `backend-ai/services/supabase_service.py`

This file already has basic Supabase operations. Here's the complete enhanced version:

```python
"""Supabase integration for database and storage."""
import logging
import os
from typing import Any, Iterable, Optional
from datetime import datetime
import uuid

from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None
_supabase_url: str | None = None


def init_supabase() -> None:
    """Initialize Supabase client"""
    global _client, _supabase_url
    if _client is not None:
        return

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    _supabase_url = supabase_url

    if not supabase_url or not supabase_key:
        logger.warning("Supabase not configured")
        return

    _client = create_client(supabase_url, supabase_key)
    logger.info("Supabase initialized")


def get_client() -> Client | None:
    return _client


# ============================================================================
# STORAGE OPERATIONS
# ============================================================================

def get_bucket() -> str:
    return os.getenv("SUPABASE_STORAGE_BUCKET", "photos")


def public_url(path: str) -> str:
    """Get public CDN URL for a file"""
    if not _supabase_url:
        return ""
    bucket = get_bucket()
    return f"{_supabase_url}/storage/v1/object/public/{bucket}/{path}"


def upload_image_bytes(data: bytes, path: str, content_type: str = "image/webp") -> str:
    """Upload image bytes to storage"""
    if _client is None:
        raise RuntimeError("Supabase not configured")

    bucket = get_bucket()
    storage = _client.storage.from_(bucket)
    storage.upload(
        path,
        data,
        {
            "content-type": content_type,
            "upsert": True,
        },
    )
    return public_url(path)


def remove_storage_paths(paths: Iterable[str]) -> None:
    """Delete files from storage"""
    if _client is None:
        return
    bucket = get_bucket()
    storage = _client.storage.from_(bucket)
    storage.remove(list(paths))


# ============================================================================
# USERS TABLE OPERATIONS
# ============================================================================

def create_user(uid: str, email: str, name: str, age: Optional[int] = None, 
                gender: Optional[str] = None, country: Optional[str] = None) -> dict[str, Any]:
    """Create new user record"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "uid": uid,
        "email": email,
        "name": name,
        "age": age,
        "gender": gender,
        "country": country,
        "role": "user",
        "quality_score": 100,
        "created_at": datetime.utcnow().isoformat()
    }
    result = _client.table("users").insert(data).execute()
    return result.data[0] if result.data else {}


def get_user_by_uid(uid: str) -> dict[str, Any] | None:
    """Get user by Firebase UID"""
    if _client is None:
        return None
    result = _client.table("users").select("*").eq("uid", uid).execute()
    return result.data[0] if result.data else None


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Get user by email"""
    if _client is None:
        return None
    result = _client.table("users").select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


def set_user_admin(email: str) -> bool:
    """Set user as admin"""
    if _client is None:
        return False
    result = _client.table("users").update({"role": "admin"}).eq("email", email).execute()
    return bool(result.data)


# ============================================================================
# SURVEYS TABLE OPERATIONS
# ============================================================================

def create_survey(title: str, description: str, created_by: str, 
                  settings: dict[str, Any]) -> dict[str, Any]:
    """Create new survey"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "title": title,
        "description": description,
        "status": "draft",
        "created_by": created_by,
        "rating_scale": settings.get("rating_scale", "1-5"),
        "randomize_order": settings.get("randomize_order", True),
        "photos_per_person": settings.get("photos_per_person", 5),
        "anti_fast_rating_enabled": settings.get("anti_fast_rating_enabled", True),
        "created_at": datetime.utcnow().isoformat()
    }
    result = _client.table("surveys").insert(data).execute()
    return result.data[0] if result.data else {}


def get_survey(survey_id: str) -> dict[str, Any] | None:
    """Get survey by ID"""
    if _client is None:
        return None
    result = _client.table("surveys").select("*").eq("id", survey_id).execute()
    return result.data[0] if result.data else None


def update_survey(survey_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Update survey"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data["updated_at"] = datetime.utcnow().isoformat()
    result = _client.table("surveys").update(data).eq("id", survey_id).execute()
    return result.data[0] if result.data else {}


def list_active_surveys() -> list[dict[str, Any]]:
    """Get all active surveys"""
    if _client is None:
        return []
    result = _client.table("surveys").select("*").eq("status", "active").execute()
    return result.data or []


# ============================================================================
# PHOTOS TABLE OPERATIONS
# ============================================================================

def create_photo_record(survey_id: str, person_id: str, slot_index: int,
                       original_filename: str, width: int, height: int,
                       file_size: int) -> dict[str, Any]:
    """Create photo record"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "id": str(uuid.uuid4()),
        "survey_id": survey_id,
        "person_id": person_id,
        "slot_index": slot_index,
        "status": "pending",
        "has_face": False,
        "original_filename": original_filename,
        "width": width,
        "height": height,
        "file_size": file_size,
        "created_at": datetime.utcnow().isoformat()
    }
    result = _client.table("photos").insert(data).execute()
    return result.data[0] if result.data else {}


def update_photo_record(photo_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Update photo record with AI validation"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data["updated_at"] = datetime.utcnow().isoformat()
    result = _client.table("photos").update(data).eq("id", photo_id).execute()
    return result.data[0] if result.data else {}


def get_photo_record(photo_id: str) -> dict[str, Any] | None:
    """Get photo by ID"""
    if _client is None:
        return None
    result = _client.table("photos").select("*").eq("id", photo_id).execute()
    return result.data[0] if result.data else None


def find_photos_by_survey(survey_id: str) -> list[dict[str, Any]]:
    """Get all photos in a survey"""
    if _client is None:
        return []
    result = _client.table("photos").select("*").eq("survey_id", survey_id).execute()
    return result.data or []


def find_photos_by_person(person_id: str) -> list[dict[str, Any]]:
    """Get all photos for a person"""
    if _client is None:
        return []
    result = _client.table("photos").select("*").eq("person_id", person_id).order("slot_index").execute()
    return result.data or []


# ============================================================================
# PARTICIPANTS TABLE OPERATIONS
# ============================================================================

def create_participant(user_id: str, survey_id: str, 
                      photo_order: list[str]) -> dict[str, Any]:
    """Create participant record"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "user_id": user_id,
        "survey_id": survey_id,
        "status": "in-progress",
        "photo_order": photo_order,
        "current_index": 0,
        "quality_score": 100,
        "is_suspicious": False,
        "started_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    result = _client.table("participants").insert(data).execute()
    return result.data[0] if result.data else {}


def get_participant(participant_id: str) -> dict[str, Any] | None:
    """Get participant record"""
    if _client is None:
        return None
    result = _client.table("participants").select("*").eq("id", participant_id).execute()
    return result.data[0] if result.data else None


def update_participant(participant_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Update participant record"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data["updated_at"] = datetime.utcnow().isoformat()
    data["last_active_at"] = datetime.utcnow().isoformat()
    result = _client.table("participants").update(data).eq("id", participant_id).execute()
    return result.data[0] if result.data else {}


def get_participant_for_survey(user_id: str, survey_id: str) -> dict[str, Any] | None:
    """Get participant record for user in survey"""
    if _client is None:
        return None
    result = _client.table("participants").select("*").eq("user_id", user_id).eq("survey_id", survey_id).execute()
    return result.data[0] if result.data else None


# ============================================================================
# RATINGS TABLE OPERATIONS
# ============================================================================

def create_rating(survey_id: str, participant_id: str, user_id: str,
                 photo_id: str, person_id: str, rating: float,
                 response_time_ms: int, is_skipped: bool = False) -> dict[str, Any]:
    """Create rating record"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "survey_id": survey_id,
        "participant_id": participant_id,
        "user_id": user_id,
        "photo_id": photo_id,
        "person_id": person_id,
        "rating": rating,
        "response_time_ms": response_time_ms,
        "is_skipped": is_skipped,
        "created_at": datetime.utcnow().isoformat()
    }
    result = _client.table("ratings").insert(data).execute()
    return result.data[0] if result.data else {}


def get_ratings_for_photo(photo_id: str) -> list[dict[str, Any]]:
    """Get all ratings for a photo"""
    if _client is None:
        return []
    result = _client.table("ratings").select("*").eq("photo_id", photo_id).execute()
    return result.data or []


def get_ratings_for_participant(participant_id: str) -> list[dict[str, Any]]:
    """Get all ratings by participant"""
    if _client is None:
        return []
    result = _client.table("ratings").select("*").eq("participant_id", participant_id).execute()
    return result.data or []


def update_rating(rating_id: str, new_rating: float) -> dict[str, Any]:
    """Update a rating"""
    if _client is None:
        raise RuntimeError("Supabase not configured")
    
    data = {
        "rating": new_rating,
        "updated_at": datetime.utcnow().isoformat()
    }
    result = _client.table("ratings").update(data).eq("id", rating_id).execute()
    return result.data[0] if result.data else {}


# ============================================================================
# ANALYTICS QUERIES
# ============================================================================

def get_survey_statistics(survey_id: str) -> dict[str, Any]:
    """Get survey statistics"""
    if _client is None:
        return {}
    
    # This is a simplified version - ideally use PostgreSQL functions
    participants = _client.table("participants").select("*").eq("survey_id", survey_id).execute()
    ratings = _client.table("ratings").select("rating").eq("survey_id", survey_id).execute()
    
    if not ratings.data:
        avg_rating = 0
    else:
        avg_rating = sum(r['rating'] for r in ratings.data) / len(ratings.data)
    
    completed = len([p for p in (participants.data or []) if p['status'] == 'completed'])
    
    return {
        "total_participants": len(participants.data or []),
        "completed_participants": completed,
        "total_ratings": len(ratings.data or []),
        "average_rating": avg_rating
    }


def get_suspicious_participants(survey_id: str) -> list[dict[str, Any]]:
    """Get participants flagged as suspicious"""
    if _client is None:
        return []
    result = _client.table("participants").select("*").eq("survey_id", survey_id).eq("is_suspicious", True).execute()
    return result.data or []
```

---

## 🔌 Using in Routers

### Example: Photo Router

```python
# File: backend-ai/routers/photo_router.py
from services import supabase_service

@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    photoId: str = Form(...),
    surveyId: str = Form(...),
    personId: str = Form(...),
    slotIndex: int = Form(...),
):
    """Upload and process photo"""
    try:
        contents = await file.read()
        
        # Upload to Supabase storage
        storage_path = f"surveys/{surveyId}/originals/{photoId}{Path(file.filename).suffix}"
        photo_url = supabase_service.upload_image_bytes(
            contents,
            storage_path,
            content_type="image/jpeg"
        )
        
        # Create photo record in database
        photo_record = supabase_service.create_photo_record(
            survey_id=surveyId,
            person_id=personId,
            slot_index=slotIndex,
            original_filename=file.filename,
            width=1024,  # Set from image analysis
            height=1024,
            file_size=len(contents)
        )
        
        # Update with URL
        supabase_service.update_photo_record(photo_record['id'], {
            "original_url": photo_url,
            "status": "processing"
        })
        
        return {"success": True, "photoId": photo_record['id']}
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## ⚛️ Frontend Integration

### File: `frontend/src/services/database.service.ts`

```typescript
import { supabase } from './supabase'

// ============================================================================
// RATINGS SERVICE
// ============================================================================

export const ratingsService = {
  // Submit a rating
  async submitRating(
    surveyId: string,
    participantId: string,
    photoId: string,
    personId: string,
    rating: number,
    responseTimeMs: number,
    isSkipped: boolean = false
  ) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Not authenticated')

    const { data, error } = await supabase.from('ratings').insert({
      survey_id: surveyId,
      participant_id: participantId,
      user_id: userData.user.id,
      photo_id: photoId,
      person_id: personId,
      rating,
      response_time_ms: responseTimeMs,
      is_skipped: isSkipped,
      created_at: new Date().toISOString(),
    })

    if (error) throw error
    return data
  },

  // Get all ratings for current participant
  async getRatingsForParticipant(participantId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('participant_id', participantId)

    if (error) throw error
    return data
  },

  // Update existing rating
  async updateRating(ratingId: string, newRating: number) {
    const { data, error } = await supabase
      .from('ratings')
      .update({ rating: newRating, updated_at: new Date().toISOString() })
      .eq('id', ratingId)

    if (error) throw error
    return data
  },
}

// ============================================================================
// PARTICIPANTS SERVICE
// ============================================================================

export const participantsService = {
  // Create participant record
  async createParticipant(
    userId: string,
    surveyId: string,
    photoOrder: string[]
  ) {
    const { data, error } = await supabase.from('participants').insert({
      user_id: userId,
      survey_id: surveyId,
      status: 'in-progress',
      photo_order: photoOrder,
      current_index: 0,
      quality_score: 100,
      is_suspicious: false,
      started_at: new Date().toISOString(),
    })

    if (error) throw error
    return data
  },

  // Get participant record
  async getParticipant(participantId: string) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single()

    if (error) throw error
    return data
  },

  // Update participant progress
  async updateProgress(participantId: string, currentIndex: number) {
    const { data, error } = await supabase
      .from('participants')
      .update({
        current_index: currentIndex,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId)

    if (error) throw error
    return data
  },

  // Complete survey
  async completeSurvey(participantId: string) {
    const { data, error } = await supabase
      .from('participants')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId)

    if (error) throw error
    return data
  },
}

// ============================================================================
// PHOTOS SERVICE
// ============================================================================

export const photosService = {
  // Get photos for survey
  async getPhotosForSurvey(surveyId: string) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('survey_id', surveyId)

    if (error) throw error
    return data
  },

  // Get photos for person
  async getPhotosForPerson(personId: string) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('person_id', personId)
      .order('slot_index')

    if (error) throw error
    return data
  },

  // Get photo details
  async getPhoto(photoId: string) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (error) throw error
    return data
  },
}

// ============================================================================
// SURVEYS SERVICE
// ============================================================================

export const surveysService = {
  // Get survey details
  async getSurvey(surveyId: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (error) throw error
    return data
  },

  // Get active surveys
  async getActiveSurveys() {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', 'active')

    if (error) throw error
    return data
  },

  // Get survey statistics
  async getSurveyStats(surveyId: string) {
    const { data, error } = await supabase.rpc('get_survey_stats', {
      survey_id: surveyId,
    })

    if (error) throw error
    return data
  },
}
```

---

## 🚀 Usage Example in React Component

```typescript
// File: frontend/src/pages/user/SurveyRatingPage.tsx
import { useState, useEffect } from 'react'
import { ratingsService, participantsService, photosService } from '@/services/database.service'

export function SurveyRatingPage({ surveyId, participantId }: Props) {
  const [photos, setPhotos] = useState([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [responseStartTime, setResponseStartTime] = useState(Date.now())

  useEffect(() => {
    loadPhotos()
    setResponseStartTime(Date.now())
  }, [currentPhotoIndex])

  const loadPhotos = async () => {
    const data = await photosService.getPhotosForSurvey(surveyId)
    setPhotos(data)
  }

  const handleRating = async (ratingValue: number) => {
    const responseTimeMs = Date.now() - responseStartTime

    // Submit rating
    await ratingsService.submitRating(
      surveyId,
      participantId,
      photos[currentPhotoIndex].id,
      photos[currentPhotoIndex].person_id,
      ratingValue,
      responseTimeMs
    )

    // Update participant progress
    const nextIndex = currentPhotoIndex + 1
    await participantsService.updateProgress(participantId, nextIndex)

    if (nextIndex < photos.length) {
      setCurrentPhotoIndex(nextIndex)
    } else {
      // Survey complete
      await participantsService.completeSurvey(participantId)
      navigateTo('/survey-complete')
    }
  }

  return (
    <div>
      <img src={photos[currentPhotoIndex]?.processed_url} />
      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map(rating => (
          <button key={rating} onClick={() => handleRating(rating)}>
            {rating}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## ✅ Integration Checklist

- [ ] Supabase project created
- [ ] Database tables created (SQL migration run)
- [ ] Storage bucket configured
- [ ] `.env` files filled with credentials
- [ ] Backend supabase_service.py updated
- [ ] Frontend database.service.ts created
- [ ] Photo router uses supabase_service
- [ ] Participant router uses supabase_service
- [ ] Rating routes implemented
- [ ] Test data created
- [ ] End-to-end testing complete

---

## 🐛 Common Issues & Solutions

### Issue: "Foreign key violation"
**Solution:** Ensure parent records exist before creating child records
```typescript
// ✅ Correct: Create parent first
await createSurvey(...)
await createPerson(surveyId) // Now surveyId exists

// ❌ Wrong: Create child with non-existent parent
await createPhoto(nonExistentSurveyId)
```

### Issue: "Permission denied" on insert
**Solution:** Check RLS policies and auth context
```typescript
// ✅ Correct: Use authenticated user context
const { data: userData } = await supabase.auth.getUser()
// Now use userData.user.id in queries

// ❌ Wrong: Missing user context
await supabase.from('ratings').insert(data) // RLS will reject
```

### Issue: "UNIQUE constraint violation"
**Solution:** Check for duplicate records
```typescript
// ✅ Correct: Check existence first
const existing = await supabase
  .from('participants')
  .select('*')
  .eq('user_id', userId)
  .eq('survey_id', surveyId)
  .single()

if (!existing.data) {
  await createParticipant(...)
}
```

---

## 📊 Monitoring

Check database usage:
1. Supabase dashboard → Reports
2. Monitor storage usage
3. Check API request quotas
4. Review slow queries

---

## 🔗 Related Docs

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Initial setup
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Schema details
- [SUPABASE_QUICK_START.md](SUPABASE_QUICK_START.md) - Quick start guide
