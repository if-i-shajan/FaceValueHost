# Database Schema & Architecture

Complete documentation of your FaceRating Platform database structure, relationships, and design decisions.

---

## 📊 Database Overview

Your Supabase database uses PostgreSQL with the following structure:

```
facerating-platform
├── users (authentication & profiles)
├── surveys (experiments/studies)
├── persons (subjects/faces in photos)
├── photos (individual images)
├── participants (responses from users)
├── ratings (review data - photo ratings)
├── attention_checks (data quality checks)
└── attention_check_results (check outcomes)
```

---

## 🗂️ Table Details

### 1. USERS TABLE

**Purpose:** Store user accounts, profiles, and role information

```sql
id              UUID PRIMARY KEY      -- Unique user ID
uid             TEXT UNIQUE           -- Firebase UID (for auth)
email           TEXT UNIQUE           -- User email
name            TEXT                  -- Full name
age             INTEGER               -- User age
gender          TEXT                  -- Gender (male, female, etc)
country         TEXT                  -- User country
role            TEXT                  -- 'user' or 'admin'
participation_count INTEGER           -- Surveys completed
quality_score   FLOAT (0-100)         -- Data quality rating
is_flagged      BOOLEAN               -- Suspicious activity flag
created_at      TIMESTAMP             -- Account creation
updated_at      TIMESTAMP             -- Last update
```

**Relationships:**
- 1 user → many surveys (if admin) `created_by`
- 1 user → many participants
- 1 user → many ratings

**Indexes:**
- `uid` (for Firebase auth lookup)
- `email` (for login)
- `role` (for permission checks)

**Sample Data:**
```json
{
  "uid": "firebase-uid-xyz",
  "email": "john@example.com",
  "name": "John Doe",
  "age": 28,
  "gender": "male",
  "country": "USA",
  "role": "user",
  "participation_count": 5,
  "quality_score": 95.5,
  "is_flagged": false
}
```

---

### 2. SURVEYS TABLE

**Purpose:** Store research surveys/experiments

```sql
id                          UUID PRIMARY KEY
title                       TEXT              -- Survey name
description                 TEXT              -- What it's about
status                      TEXT              -- draft, active, paused, completed
created_by                  UUID FK           -- Admin who created it
photo_ids                   TEXT[]            -- Array of photo IDs
participant_count           INTEGER           -- Total participants
completed_count             INTEGER           -- Completed surveys

-- Survey Settings
rating_scale                TEXT              -- '1-5', '1-10', 'slider', 'emoji'
randomize_order             BOOLEAN           -- Randomize photo order?
photos_per_person           INTEGER           -- How many photos to rate
mandatory_viewing_time_seconds INTEGER        -- Min seconds per photo

allow_resume                BOOLEAN           -- Resume if disconnected?
max_duration_minutes        INTEGER           -- Max survey duration

skip_enabled                BOOLEAN           -- Can skip photos?
skip_max_count              INTEGER           -- Max skips allowed
skip_delay_seconds          INTEGER           -- Seconds before can skip
skip_reappear_later         BOOLEAN           -- Skipped photos reappear?

prev_photo_enabled          BOOLEAN           -- Can go back?
prev_photo_max              INTEGER           -- Max times to go back

break_enabled               BOOLEAN           -- Force breaks?
break_after_count           INTEGER           -- Break after N photos
break_duration_seconds      INTEGER           -- Break length

anti_fast_rating_enabled    BOOLEAN           -- Detect fast rating?
anti_fast_rating_min_ms     INTEGER           -- Min time per rating (ms)
anti_fast_rating_identical_threshold FLOAT    -- Flag if all same rating
anti_fast_rating_max_skip_rate FLOAT          -- Max skip rate allowed

created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

**Relationships:**
- 1 survey → many persons
- 1 survey → many photos
- 1 survey → many participants
- 1 survey → many ratings

**Sample Data:**
```json
{
  "title": "Face Attractiveness Study",
  "description": "Rate perceived attractiveness of faces",
  "status": "active",
  "rating_scale": "1-10",
  "randomize_order": true,
  "photos_per_person": 20,
  "participant_count": 150,
  "completed_count": 45
}
```

---

### 3. PERSONS TABLE

**Purpose:** Store subjects (people whose photos are being rated)

```sql
id                  UUID PRIMARY KEY
survey_id           UUID FK          -- Which survey
person_code         TEXT             -- Identifier (e.g., "P001", "P002")
completion_percentage FLOAT          -- % of photos rated
created_at          TIMESTAMP
updated_at          TIMESTAMP

UNIQUE(survey_id, person_code)
```

**Relationships:**
- 1 person → many photos
- 1 person → many ratings

**Data Model:**
```
Survey
  ├─ Person 1 (P001)
  │   ├─ Photo 1
  │   ├─ Photo 2
  │   └─ Photo 3
  ├─ Person 2 (P002)
  │   ├─ Photo 1
  │   └─ Photo 2
  └─ Person N
```

**Sample Data:**
```json
{
  "survey_id": "uuid-survey-123",
  "person_code": "P001",
  "completion_percentage": 85.5
}
```

---

### 4. PHOTOS TABLE

**Purpose:** Store individual photos with AI validation data

```sql
id                      UUID PRIMARY KEY
survey_id               UUID FK          -- Which survey
person_id               UUID FK          -- Which person
slot_index              INTEGER          -- Photo slot (1, 2, 3...)

-- URLs
original_url            TEXT             -- Original uploaded image
processed_url           TEXT             -- AI-processed/cropped image
thumbnail_url           TEXT             -- Thumbnail for UI

-- Status
status                  TEXT             -- pending, processing, approved, rejected

-- AI Validation Data
has_face                BOOLEAN          -- Face detected?
face_count              INTEGER          -- How many faces?
is_blurry               BOOLEAN          -- Blurry image?
is_low_resolution       BOOLEAN          -- Too low resolution?
face_confidence         FLOAT (0-1)      -- Detection confidence
face_embedding          VECTOR(512)      -- 512-dim face embedding (for similarity)
ai_warnings             TEXT[]           -- List of warnings

-- Image Metadata
original_filename       TEXT             -- Original filename
width                   INTEGER          -- Image width (px)
height                  INTEGER          -- Image height (px)
file_size               INTEGER          -- File size (bytes)
format                  TEXT             -- Image format (jpg, png, etc)

created_at              TIMESTAMP
updated_at              TIMESTAMP

UNIQUE(person_id, slot_index)
```

**AI Validation:**
- `has_face`: Detected human face?
- `face_count`: Single face, multiple faces, or none?
- `is_blurry`: Image too blurry for rating?
- `face_confidence`: How confident is the AI? (0.0-1.0)
- `face_embedding`: 512-dimensional vector for similarity matching

**Relationships:**
- 1 photo → many ratings

**Sample Data:**
```json
{
  "survey_id": "uuid-survey-123",
  "person_id": "uuid-person-p001",
  "slot_index": 1,
  "status": "approved",
  "has_face": true,
  "face_count": 1,
  "is_blurry": false,
  "face_confidence": 0.98,
  "original_filename": "photo_001.jpg",
  "width": 1024,
  "height": 1024
}
```

---

### 5. PARTICIPANTS TABLE

**Purpose:** Track user participation in surveys (one row = one user in one survey)

```sql
id                      UUID PRIMARY KEY
user_id                 UUID FK          -- Which user
survey_id               UUID FK          -- Which survey
status                  TEXT             -- in-progress, completed, abandoned, flagged

-- Progress Tracking
photo_order             TEXT[]           -- Randomized order of photos
current_index           INTEGER          -- Current photo index
completed_photo_ids     TEXT[]           -- Completed ratings
skipped_photo_ids       TEXT[]           -- Skipped photos

-- Timing
started_at              TIMESTAMP        -- When started
completed_at            TIMESTAMP        -- When finished
last_active_at          TIMESTAMP        -- Last activity

-- Quality Metrics
quality_score           FLOAT (0-100)    -- Overall quality score
is_suspicious           BOOLEAN          -- Flagged as suspicious?
fast_rating_count       INTEGER          -- Times rated too fast
identical_rating_count  INTEGER          -- Times gave same rating consecutively
excessive_skip_count    INTEGER          -- Times exceeded skip limit
rapid_click_count       INTEGER          -- Rapid clicking detected

-- Engagement
breaks_taken            INTEGER          -- Number of breaks taken
total_time_seconds      INTEGER          -- Total survey duration (seconds)

created_at              TIMESTAMP
updated_at              TIMESTAMP

UNIQUE(user_id, survey_id)
```

**Quality Flags:**
- `fast_rating_count`: Rating photo in < 500ms
- `identical_rating_count`: Same rating for multiple photos
- `excessive_skip_count`: Skipped more than allowed
- `is_suspicious`: Overall quality score < threshold

**Sample Data:**
```json
{
  "user_id": "uuid-user-123",
  "survey_id": "uuid-survey-abc",
  "status": "in-progress",
  "current_index": 15,
  "photo_order": ["photo-001", "photo-003", "photo-002"],
  "completed_photo_ids": ["photo-001", "photo-003"],
  "quality_score": 92.5,
  "is_suspicious": false,
  "total_time_seconds": 480
}
```

---

### 6. RATINGS TABLE (Review Data)

**Purpose:** Store individual photo ratings from participants

```sql
id                  UUID PRIMARY KEY
survey_id           UUID FK          -- Which survey
participant_id      UUID FK          -- Which participant
user_id             UUID FK          -- Which user
photo_id            UUID FK          -- Which photo rated
person_id           UUID FK          -- Which person

rating              FLOAT            -- The rating value (1-10, -1 to 1, etc)
response_time_ms    INTEGER          -- Time taken to rate (milliseconds)
is_skipped          BOOLEAN          -- Was this skipped?

edit_history        JSONB            -- Array of edits:
                                     -- [{
                                     --   previousRating: 7,
                                     --   newRating: 8,
                                     --   editedAt: "2024-05-22T10:30:00Z"
                                     -- }]

created_at          TIMESTAMP
updated_at          TIMESTAMP

UNIQUE(participant_id, photo_id)
```

**Key Fields:**
- `rating`: The actual rating value submitted
- `response_time_ms`: How long user took to rate (in milliseconds)
  - < 500ms = might be too fast
  - > 30000ms = very slow, might indicate distraction
- `is_skipped`: TRUE if user skipped this photo
- `edit_history`: Track changes if user edits rating

**Relationships:**
- N ratings ← 1 participant
- N ratings ← 1 user
- N ratings ← 1 photo
- N ratings ← 1 survey

**Sample Data:**
```json
{
  "survey_id": "uuid-survey-123",
  "participant_id": "uuid-participant-xyz",
  "user_id": "uuid-user-123",
  "photo_id": "uuid-photo-001",
  "person_id": "uuid-person-p001",
  "rating": 7.5,
  "response_time_ms": 1500,
  "is_skipped": false,
  "edit_history": [
    {
      "previousRating": 7,
      "newRating": 7.5,
      "editedAt": "2024-05-22T10:30:05Z"
    }
  ]
}
```

---

### 7. ATTENTION_CHECKS TABLE

**Purpose:** Define attention checks to catch inattentive raters

```sql
id              UUID PRIMARY KEY
survey_id       UUID FK          -- Which survey
photo_id        UUID FK          -- Which photo (the test photo)
required_rating INTEGER          -- Expected/required rating
failure_action  TEXT             -- warn, flag, or disqualify
created_at      TIMESTAMP
```

**How It Works:**
1. Admin marks certain photos as "attention checks"
2. These photos have a **required_rating** (e.g., must rate 10)
3. If participant rates differently → apply failure_action

**Failure Actions:**
- `warn`: Show warning message to participant
- `flag`: Flag participant as potentially dishonest
- `disqualify`: Disqualify participant, reject responses

**Sample Data:**
```json
{
  "survey_id": "uuid-survey-123",
  "photo_id": "uuid-photo-attention-001",
  "required_rating": 10,
  "failure_action": "flag"
}
```

---

### 8. ATTENTION_CHECK_RESULTS TABLE

**Purpose:** Track attention check outcomes for each participant

```sql
id              UUID PRIMARY KEY
participant_id  UUID FK          -- Which participant took the check
check_id        UUID FK          -- Which attention check
passed          BOOLEAN          -- Did they pass?
given_rating    FLOAT            -- What rating did they give?
created_at      TIMESTAMP
```

**Sample Data:**
```json
{
  "participant_id": "uuid-participant-xyz",
  "check_id": "uuid-attention-check-001",
  "passed": true,
  "given_rating": 10
}
```

---

## 📈 Entity Relationship Diagram

```
users
  ├─ 1:N → surveys (created_by)
  ├─ 1:N → participants (user_id)
  └─ 1:N → ratings (user_id)

surveys
  ├─ 1:N → persons
  ├─ 1:N → photos
  ├─ 1:N → participants
  ├─ 1:N → ratings
  └─ 1:N → attention_checks

persons
  ├─ 1:N → photos
  └─ 1:N → ratings

photos
  ├─ 1:N → ratings
  └─ 1:N → attention_checks

participants
  ├─ 1:N → ratings
  └─ 1:N → attention_check_results

attention_checks
  └─ 1:N → attention_check_results
```

---

## 🔍 Data Flow Example

**Scenario: User rates photos in a survey**

```
1. User registers
   └─ INSERT INTO users (uid, email, name, role)

2. Admin creates survey
   └─ INSERT INTO surveys (title, status, created_by)

3. Admin uploads photos
   ├─ INSERT INTO persons (survey_id, person_code)
   └─ INSERT INTO photos (survey_id, person_id, ...)

4. User participates
   ├─ INSERT INTO participants (user_id, survey_id)
   └─ participants.photo_order = randomize(photo_ids)

5. User rates a photo
   └─ INSERT INTO ratings (
        participant_id, user_id, photo_id, rating, response_time_ms
      )

6. System checks if fast rating
   ├─ IF response_time_ms < 500ms
   └─ UPDATE participants SET fast_rating_count++

7. User completes survey
   ├─ UPDATE participants SET status = 'completed'
   └─ UPDATE surveys SET completed_count++

8. Admin analyzes results
   ├─ SELECT AVG(rating) FROM ratings WHERE photo_id = ?
   ├─ SELECT AVG(response_time_ms) FROM ratings
   └─ SELECT * FROM participants WHERE is_suspicious = true
```

---

## 🔒 Row Level Security (RLS) Policies

All tables have RLS enabled:

```
users
  - Users can read own profile
  - Admins can read all profiles

surveys
  - Authenticated users can read published surveys
  - Admins can create/edit/delete surveys

photos
  - Only survey participants can view photos

ratings
  - Users can only see/edit their own ratings

participants
  - Users can only see their own participation data
```

---

## 📊 Useful Queries

### Get survey statistics
```sql
SELECT 
  s.title,
  COUNT(DISTINCT p.id) as total_participants,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed,
  AVG(r.rating) as avg_rating,
  AVG(r.response_time_ms) as avg_response_time
FROM surveys s
LEFT JOIN participants p ON p.survey_id = s.id
LEFT JOIN ratings r ON r.survey_id = s.id
WHERE s.id = 'survey-id-here'
GROUP BY s.id;
```

### Find suspicious participants
```sql
SELECT 
  p.id,
  u.email,
  p.quality_score,
  p.fast_rating_count,
  p.identical_rating_count
FROM participants p
JOIN users u ON u.id = p.user_id
WHERE p.is_suspicious = true
ORDER BY p.quality_score ASC;
```

### Get ratings for a photo
```sql
SELECT 
  r.rating,
  r.response_time_ms,
  u.name,
  p.quality_score
FROM ratings r
JOIN users u ON u.id = r.user_id
JOIN participants p ON p.id = r.participant_id
WHERE r.photo_id = 'photo-id-here'
ORDER BY r.created_at DESC;
```

### Compare faces (similarity)
```sql
SELECT 
  p1.id as photo1_id,
  p2.id as photo2_id,
  1 - (p1.face_embedding <-> p2.face_embedding) as similarity_score
FROM photos p1, photos p2
WHERE p1.survey_id = 'survey-id'
AND p2.survey_id = 'survey-id'
AND p1.id < p2.id
ORDER BY similarity_score DESC
LIMIT 10;
```

---

## 🗄️ Storage Schema

Your Supabase storage bucket `photos` has this structure:

```
photos/
├── surveys/
│   ├── {survey-id}/
│   │   ├── originals/
│   │   │   ├── {photo-id}.jpg
│   │   │   └── {photo-id}.png
│   │   ├── processed/
│   │   │   ├── {photo-id}_processed.webp
│   │   │   └── {photo-id}_processed.webp
│   │   └── thumbnails/
│   │       ├── {photo-id}_thumb.webp
│   │       └── {photo-id}_thumb.webp
│   └── {other-survey-id}/
│       └── ...
```

**File Types:**
- `originals/`: Raw uploaded images (JPG, PNG)
- `processed/`: AI-processed & cropped faces (WebP)
- `thumbnails/`: Small previews (WebP, ~200px)

**Naming Convention:**
- `{survey-id}/{person-id}/{slot-index}.jpg`
- Example: `survey-123/person-p001/1.jpg`

---

## 📈 Scalability

### Current Limits (Supabase Free):
- 500MB database storage
- 1GB file storage
- 50k requests/month

### When to upgrade:
- > 100 surveys
- > 10,000 photos
- > 1,000 participants
- > 100,000 ratings

### Optimization strategies:
- Archive old surveys
- Compress images to WebP
- Delete temporary files
- Use indexes on common queries

---

## 🔄 Backup & Recovery

All data is automatically backed up:

1. **Point-in-time recovery** - up to 30 days (Pro plan)
2. **Daily automated backups** - stored in multiple regions
3. **Manual backups** - export any table anytime

### Export data:
```bash
# Export specific table
supabase db pull --schema public --table ratings > ratings_backup.sql

# Export all data
supabase db pull > full_backup.sql
```

---

## 📚 Next Steps

1. ✅ Understand schema structure
2. ⏭️ Set up Supabase project
3. ⏭️ Run database migrations
4. ⏭️ Start creating surveys
5. ⏭️ Upload photos
6. ⏭️ Run tests with real data
7. ⏭️ Monitor analytics
