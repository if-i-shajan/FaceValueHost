# 🏗️ Architecture Overview

Complete visual guide to your FaceRating platform with Supabase database integration.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FACERATING PLATFORM                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Pages & Components                         │   │
│  │  • LoginPage              • AdminDashboard             │   │
│  │  • SurveyListPage         • AdminParticipants          │   │
│  │  • SurveyRatingPage       • AdminPhotoManager          │   │
│  │  • SurveyCompletePage     • AdminResults               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Services Layer                       │   │
│  │  • auth.service.ts          (Firebase Auth)            │   │
│  │  • database.service.ts       (Supabase Queries)        │   │
│  │  • survey.service.ts         (Survey Operations)       │   │
│  │  • photo.service.ts          (Photo Operations)        │   │
│  │  • report.service.ts         (Analytics)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SDK Clients                          │   │
│  │  • Supabase Client (supabase-js)                       │   │
│  │  • Firebase Auth SDK                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          ↓                              ↓
   ┌─────────────────┐           ┌─────────────────┐
   │  Firebase Auth  │           │  Supabase       │
   │  (JWT Token)    │           │  (Session)      │
   └─────────────────┘           └─────────────────┘
          ↓                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI - Python)                   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                 API Routes                            │   │
│  │  • POST /upload-photo           (Photo Upload)        │   │
│  │  • GET /photos/{id}              (Get Photo)           │   │
│  │  • POST /rating                  (Submit Rating)       │   │
│  │  • POST /participants            (Create Participant)  │   │
│  │  • GET /surveys                  (List Surveys)        │   │
│  │  • POST /similarity              (Face Similarity)     │   │
│  └────────────────────────────────────────────────────────┘   │
│                           ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             Services Layer (Python)                   │   │
│  │  • supabase_service.py      (Database & Storage)       │   │
│  │  • face_processor.py         (AI Face Detection)       │   │
│  │  • firebase_service.py       (Auth Verification)       │   │
│  └────────────────────────────────────────────────────────┘   │
│                           ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │               External Services                        │   │
│  │  • InsightFace (Face Detection & Embeddings)          │   │
│  │  • OpenCV (Image Processing)                          │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE (Database & Storage)                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             PostgreSQL Database                        │   │
│  │                                                        │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐       │   │
│  │  │  users   │ surveys  │ persons  │  photos  │       │   │
│  │  └──────────┴──────────┴──────────┴──────────┘       │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐       │   │
│  │  │  ratings │partici-  │ attention│ attention│       │   │
│  │  │          │  pants   │  checks  │  results │       │   │
│  │  └──────────┴──────────┴──────────┴──────────┘       │   │
│  │                                                        │   │
│  │  ✓ Row Level Security (RLS) Enabled                 │   │
│  │  ✓ Automatic Backups                                │   │
│  │  ✓ Real-time Subscriptions                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Cloud Storage (CDN)                         │   │
│  │                                                        │   │
│  │  surveys/                                             │   │
│  │  ├── survey-id/                                       │   │
│  │  │   ├── originals/        (Raw uploads)             │   │
│  │  │   ├── processed/        (AI-cropped faces)        │   │
│  │  │   └── thumbnails/       (UI previews)             │   │
│  │  └── ...                                             │   │
│  │                                                        │   │
│  │  ✓ CDN Distribution (Fast worldwide access)          │   │
│  │  ✓ Public read access (via RLS)                      │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### User Registration Flow
```
User Input
   ↓
┌─────────────────────┐
│ Frontend            │
│ LoginPage.tsx       │ → Collect: email, password, name, age, gender
└─────────────────────┘
   ↓
┌─────────────────────────────────────────┐
│ Firebase Authentication                 │
│ auth.service.ts                         │ → Create Firebase user account
└─────────────────────────────────────────┘ → Return Firebase UID
   ↓
┌─────────────────────────────────────────┐
│ Create User Record (Supabase)           │
│ database.service.ts                     │ → Store: uid, email, name, age, gender
└─────────────────────────────────────────┘ → Store in "users" table
   ↓
✅ User Registration Complete
   Account: Firebase + Supabase
```

---

### Photo Upload Flow
```
Admin selects photos
   ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: AdminPhotoManager.tsx                          │
│ • Select photo file                                      │
│ • Associate with Person & Survey                         │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: POST /upload-photo                              │
│ • Receive file bytes + metadata                          │
│ • Validate file type (JPG, PNG, WEBP)                   │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Supabase Storage                                         │
│ • Upload original image                                  │
│ • Get public URL                                         │
│ • Return: original_url                                   │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: Create Photo Record                             │
│ • Insert into "photos" table                             │
│ • Set status: "pending"                                  │
│ • Store original_url                                     │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: AI Processing (Face Detection)                  │
│ • Download image from storage                            │
│ • Run InsightFace model                                  │
│ • Extract: face embedding, coordinates, confidence      │
│ • Detect: blur, resolution, face count                   │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: Process Faces                                   │
│ • Crop face from image                                   │
│ • Resize to standard size                                │
│ • Convert to WebP (optimized)                            │
│ • Create thumbnail                                       │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Supabase Storage                                         │
│ • Upload processed image                                 │
│ • Upload thumbnail                                       │
│ • Get public URLs                                        │
└──────────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: Update Photo Record                             │
│ • Save: processed_url, thumbnail_url                     │
│ • Save: has_face, face_count, face_confidence           │
│ • Save: face_embedding (512-dim vector)                  │
│ • Save: is_blurry, is_low_resolution                     │
│ • Set status: "approved" (if valid) or "rejected"       │
└──────────────────────────────────────────────────────────┘
   ↓
✅ Photo Upload Complete
   Status: Approved & Ready for Rating
```

---

### Rating Submission Flow
```
User views photo in survey
   ↓
┌──────────────────────────────────────────────────────┐
│ Frontend: SurveyRatingPage.tsx                       │
│ • Display photo                                      │
│ • Show rating scale (1-10)                           │
│ • Start timer (for response time)                    │
└──────────────────────────────────────────────────────┘
   ↓
User submits rating
   ↓
┌──────────────────────────────────────────────────────┐
│ Frontend: Calculate & Prepare                        │
│ • Calculate response time (ms)                       │
│ • Get current participant ID                         │
│ • Get current user ID                                │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│ Backend: POST /ratings                               │
│ • Receive rating value                               │
│ • Receive response time                              │
│ • Verify user & participant                          │
│ • Verify photo exists                                │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│ Backend: Quality Checks                              │
│ • Is response time < 500ms? → fast_rating_count++   │
│ • Is rating same as previous? → identical_count++   │
│ • Excessive skips? → excessive_skip_count++         │
│ • Update participant quality_score                   │
│ • Flag as suspicious if needed                       │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│ Supabase: Insert Rating Record                       │
│ • Create row in "ratings" table                      │
│ • Store: survey_id, participant_id, photo_id, etc    │
│ • Store: rating value, response_time_ms              │
│ • Store: timestamp                                   │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│ Backend: Update Participant Record                   │
│ • Add to completed_photo_ids                         │
│ • Increment current_index                            │
│ • Update last_active_at                              │
│ • Update total_time_seconds                          │
└──────────────────────────────────────────────────────┘
   ↓
✅ Rating Submission Complete
   Database: Rating stored
   Progress: Participant moved to next photo
```

---

## 🗄️ Database Structure Diagram

```
USERS
┌─────────────────────────────────┐
│ id (UUID)                       │
│ uid (Firebase)                  │
│ email                           │
│ name, age, gender, country      │
│ role (user, admin)              │
│ quality_score (0-100)           │
│ is_flagged                      │
└─────────────────────────────────┘
          ↓
     (created_by)
          ↓
     ┌──────────────────────────────────────┐
     │ SURVEYS                              │
     ├──────────────────────────────────────┤
     │ id (UUID)                            │
     │ title, description                   │
     │ status (draft, active, paused, done) │
     │ rating_scale, randomize_order        │
     │ photos_per_person, etc               │
     │ participant_count, completed_count   │
     └──────────────────────────────────────┘
          ↓
     ┌────────┴──────────────┬──────────────┐
     ↓                       ↓               ↓
PERSONS              PARTICIPANTS          RATINGS
(Subjects)           (User Responses)      (Individual Ratings)
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ id           │   │ id               │   │ id               │
│ person_code  │   │ user_id ──────┐  │   │ participant_id ─→ PARTICIPANTS
│ completion_% │   │ status         │  │   │ photo_id ────────→ PHOTOS
└──────────────┘   │ quality_score  │  │   │ rating (1-10)    │
     ↓             │ is_suspicious  │  │   │ response_time_ms │
     ↓             │ photo_order    │  │   │ is_skipped       │
   PHOTOS          │ current_index  │  │   │ edit_history     │
┌──────────────┐   └──────────────────┘   └──────────────────┘
│ id           │   ↓
│ slot_index   │   └─────→ ATTENTION_CHECKS
│ status       │           (Anti-cheating)
│ has_face     │           ┌──────────────────┐
│ face_count   │           │ id               │
│ is_blurry    │           │ survey_id        │
│ face_embedding           │ photo_id         │
│ (VECTOR 512) │           │ required_rating  │
│ original_url │           └──────────────────┘
│ processed_url                   ↓
│ thumbnail_url              ATTENTION_RESULTS
└──────────────┘            ┌──────────────────┐
                            │ participant_id   │
                            │ check_id         │
                            │ passed (T/F)     │
                            │ given_rating     │
                            └──────────────────┘
```

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────┐
│ AUTHENTICATION                              │
├─────────────────────────────────────────────┤
│ User provides: email + password             │
│        ↓                                    │
│ Firebase Authentication                     │
│        ↓                                    │
│ Returns: JWT Token (stored in frontend)     │
│        ↓                                    │
│ Token sent with every request (header)      │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ ROW LEVEL SECURITY (RLS)                    │
├─────────────────────────────────────────────┤
│ Policy: Users can only read own data        │
│        ↓                                    │
│ users → SELECT (own profile + admin all)    │
│ ratings → SELECT (own ratings only)         │
│ participants → SELECT (own participation)   │
│        ↓                                    │
│ Admin → Can read/write all data             │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ STORAGE BUCKET SECURITY                     │
├─────────────────────────────────────────────┤
│ Bucket: photos (public CDN)                 │
│ Policy: Authenticated users can upload      │
│ Policy: All users can read (public URLs)    │
│ Policy: Only admins can delete              │
└─────────────────────────────────────────────┘
```

---

## 📈 Scalability Architecture

```
CURRENT (Supabase Free - Dev)
├─ 500MB database
├─ 1GB storage
├─ 50k API requests/month
└─ Good for: < 100 participants

        ↓ Growth ↓

PROFESSIONAL (Supabase Pro)
├─ 8GB database
├─ 100GB storage
├─ Unlimited API requests
├─ Point-in-time recovery
└─ Good for: 100-1000 participants

        ↓ Growth ↓

ENTERPRISE (Supabase Team)
├─ Custom database size
├─ Custom storage
├─ Dedicated support
├─ Advanced security
└─ Good for: > 1000 participants

OPTIMIZATION STRATEGIES:
├─ Archive old surveys
├─ Compress images (WebP)
├─ Create indexes
├─ Use materialized views
├─ Partition large tables
└─ Add CDN caching
```

---

## 🔌 API Integration Points

```
Frontend ←→ Backend (HTTP REST API)
    ↓
POST /upload-photo
  Req: file, photoId, surveyId, personId, slotIndex
  Res: {success: true, photoId: "..."}

POST /ratings
  Req: surveyId, participantId, photoId, rating, responseTimeMs
  Res: {id: "...", created_at: "..."}

GET /surveys/{id}
  Res: {id, title, description, status, photos, ...}

POST /participants
  Req: userId, surveyId
  Res: {id, photoOrder, currentIndex, ...}

Backend ←→ Supabase (SDK)
    ↓
table("users").insert(...)
table("photos").update(...)
table("ratings").select(...)
storage.from("photos").upload(...)
```

---

## 📊 Component Dependencies

```
App.tsx
├── ProtectedRoute
│   ├── AdminRoute (AdminDashboard)
│   │   ├── AdminSurveys
│   │   ├── AdminPhotoManager
│   │   ├── AdminParticipants
│   │   ├── AdminResults
│   │   └── AdminSettings
│   └── UserRoute (UserDashboard)
│       ├── SurveyListPage
│       ├── SurveyRatingPage
│       ├── SurveyCompletePage
│       └── SurveyConsentPage
├── LoginPage
└── RegisterPage

All components use:
├── supabase.ts (Supabase client)
├── auth.service.ts
├── database.service.ts
├── survey.service.ts
├── photo.service.ts
└── report.service.ts
```

---

## 🎯 Data Privacy & Compliance

```
User Data Flow:
├── User uploads data
│   ↓
├── Stored in Supabase PostgreSQL
│   ├── Encrypted at rest
│   ├── Encrypted in transit (TLS/SSL)
│   ├── Access controlled by RLS
│   └── Backups automated
│   ↓
├── User's own access
│   ├── Authenticated via Firebase JWT
│   ├── RLS ensures row-level security
│   └── Can view/edit only own data
│   ↓
├── Admin access
│   ├── Special admin role
│   ├── Can view all survey data
│   ├── Cannot access raw data (some fields)
│   └── All actions logged
│   ↓
└── Data deletion
    ├── User can request account deletion
    ├── Soft delete (mark as deleted)
    ├── Hard delete (purge after 30 days)
    └── Compliance with GDPR/CCPA
```

---

## 🚀 Deployment Architecture

```
DEVELOPMENT
├── Local Frontend: http://localhost:5173
├── Local Backend: http://localhost:8000
├── Dev Supabase Project
└── Local environment variables

        ↓ Testing Complete ↓

STAGING
├── Frontend: https://staging.yourdomain.com
├── Backend: https://api-staging.yourdomain.com
├── Staging Supabase Project
└── Staging environment variables

        ↓ QA Complete ↓

PRODUCTION
├── Frontend: https://yourdomain.com (Vercel/Firebase)
├── Backend: https://api.yourdomain.com (Cloud Run/Heroku)
├── Production Supabase Project
├── Production environment variables
├── Enable SSL/TLS
├── Enable CORS properly
├── Setup monitoring & alerts
└── Enable backups & recovery
```

---

## 📞 Monitoring & Health Checks

```
Frontend Monitoring
├── Browser console errors
├── Performance metrics
├── User behavior tracking
└── Error reporting service

Backend Monitoring
├── API response times
├── Error logs
├── Database query performance
└── Storage usage

Supabase Monitoring
├── Database storage usage
├── API request quotas
├── Query performance
├── Backup status
└── Security alerts
```

---

**This architecture ensures:**
✅ Scalability
✅ Security
✅ Performance
✅ Reliability
✅ Maintainability
