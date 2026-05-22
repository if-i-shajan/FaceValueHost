# Supabase Database Setup Guide

Complete guide for setting up your Supabase database for the FaceRating Platform.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"Start Your Project"**
3. Sign up or log in
4. Create a new project:
   - **Project Name**: `facerating-platform`
   - **Password**: Save it securely
   - **Region**: Select closest to your users
5. Wait for project initialization (2-3 minutes)

## Step 2: Get Your Credentials

### For Backend (Service Role Key):
1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### For Frontend (Anon Key):
1. Copy from same page:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Anon Key` → `VITE_SUPABASE_ANON_KEY`

### Create `.env` files:

**`backend-ai/.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=photos
```

**`frontend/.env.local`:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Create Database Tables

### Execute SQL Migrations

Go to **SQL Editor** in Supabase dashboard and execute these queries:

---

### 3.1 Create Users Table

```sql
-- Users table with role management
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,  -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  country TEXT,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  participation_count INTEGER DEFAULT 0,
  quality_score FLOAT DEFAULT 100,
  is_flagged BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### 3.2 Create Surveys Table

```sql
-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  photo_ids TEXT[],  -- Array of photo IDs
  participant_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Survey Settings (stored as JSONB for flexibility)
  rating_scale TEXT DEFAULT '1-5',
  randomize_order BOOLEAN DEFAULT true,
  photos_per_person INTEGER DEFAULT 5,
  mandatory_viewing_time_seconds INTEGER DEFAULT 0,
  allow_resume BOOLEAN DEFAULT true,
  max_duration_minutes INTEGER,
  
  skip_enabled BOOLEAN DEFAULT false,
  skip_max_count INTEGER,
  skip_delay_seconds INTEGER,
  skip_reappear_later BOOLEAN DEFAULT true,
  
  prev_photo_enabled BOOLEAN DEFAULT false,
  prev_photo_max INTEGER,
  
  break_enabled BOOLEAN DEFAULT false,
  break_after_count INTEGER,
  break_duration_seconds INTEGER,
  
  anti_fast_rating_enabled BOOLEAN DEFAULT true,
  anti_fast_rating_min_ms INTEGER DEFAULT 500,
  anti_fast_rating_identical_threshold FLOAT DEFAULT 0.9,
  anti_fast_rating_max_skip_rate FLOAT DEFAULT 0.3
);

CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
```

---

### 3.3 Create Persons Table

```sql
-- Persons in surveys (each person has multiple photo slots)
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  person_code TEXT NOT NULL,
  completion_percentage FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(survey_id, person_code)
);

CREATE INDEX idx_persons_survey_id ON persons(survey_id);
CREATE INDEX idx_persons_person_code ON persons(person_code);
```

---

### 3.4 Create Photos Table

```sql
-- Photos table with AI validation data
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  original_url TEXT,
  processed_url TEXT,
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- AI Validation
  has_face BOOLEAN DEFAULT false,
  face_count INTEGER DEFAULT 0,
  is_blurry BOOLEAN DEFAULT false,
  is_low_resolution BOOLEAN DEFAULT false,
  face_confidence FLOAT,
  face_embedding VECTOR(512),  -- For similarity matching
  ai_warnings TEXT[],
  
  -- Metadata
  original_filename TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  format TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(person_id, slot_index)
);

CREATE INDEX idx_photos_survey_id ON photos(survey_id);
CREATE INDEX idx_photos_person_id ON photos(person_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_has_face ON photos(has_face);

-- Create vector index for similarity search (requires pgvector extension)
-- CREATE INDEX idx_photos_embedding ON photos USING ivfflat (face_embedding vector_cosine_ops) WITH (lists = 100);
```

---

### 3.5 Create Participants Table

```sql
-- Survey participants (one row per user per survey)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('in-progress', 'completed', 'abandoned', 'flagged')) DEFAULT 'in-progress',
  photo_order TEXT[],  -- Randomized photo order
  current_index INTEGER DEFAULT 0,
  completed_photo_ids TEXT[],
  skipped_photo_ids TEXT[],
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Quality metrics
  quality_score FLOAT DEFAULT 100,
  is_suspicious BOOLEAN DEFAULT false,
  fast_rating_count INTEGER DEFAULT 0,
  identical_rating_count INTEGER DEFAULT 0,
  excessive_skip_count INTEGER DEFAULT 0,
  rapid_click_count INTEGER DEFAULT 0,
  
  breaks_taken INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, survey_id)
);

CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_survey_id ON participants(survey_id);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_is_suspicious ON participants(is_suspicious);
```

---

### 3.6 Create Ratings Table (Reviews)

```sql
-- Ratings/Reviews - Individual photo ratings from participants
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  rating FLOAT NOT NULL,
  response_time_ms INTEGER,
  is_skipped BOOLEAN DEFAULT false,
  
  -- Edit history
  edit_history JSONB,  -- Array of {previousRating, newRating, editedAt}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(participant_id, photo_id)
);

CREATE INDEX idx_ratings_survey_id ON ratings(survey_id);
CREATE INDEX idx_ratings_participant_id ON ratings(participant_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_photo_id ON ratings(photo_id);
CREATE INDEX idx_ratings_person_id ON ratings(person_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);
```

---

### 3.7 Create Attention Checks Table

```sql
-- Attention checks for anti-cheating
CREATE TABLE IF NOT EXISTS attention_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  required_rating INTEGER NOT NULL,
  failure_action TEXT CHECK (failure_action IN ('warn', 'flag', 'disqualify')) DEFAULT 'warn',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attention_checks_survey_id ON attention_checks(survey_id);
CREATE INDEX idx_attention_checks_photo_id ON attention_checks(photo_id);

-- Attention check results
CREATE TABLE IF NOT EXISTS attention_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES attention_checks(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  given_rating FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attention_check_results_participant_id ON attention_check_results(participant_id);
```

---

## Step 4: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **Create a new bucket**
3. **Name**: `photos`
4. **Public bucket**: Toggle ON (for CDN access)
5. Click **Create bucket**

## Step 5: Configure Row Level Security (RLS)

### Enable RLS on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_check_results ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies:

```sql
-- Users: Users can read their own profile, admins can read all
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = uid OR role = 'admin');

-- Surveys: Participants can read published surveys
CREATE POLICY "Surveys are readable by all authenticated users" ON surveys
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage surveys" ON surveys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Photos: Users can see photos from surveys they participate in
CREATE POLICY "Photos readable to survey participants" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.survey_id = photos.survey_id
      AND participants.user_id = auth.uid()
    )
  );

-- Ratings: Users can read/write their own ratings
CREATE POLICY "Users can read own ratings" ON ratings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ratings" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON ratings
  FOR UPDATE USING (user_id = auth.uid());

-- Participants: Users can read/write their own participation data
CREATE POLICY "Users can read own participant record" ON participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own participant record" ON participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant record" ON participants
  FOR UPDATE USING (user_id = auth.uid());
```

## Step 6: Enable Vector Extension (for similarity search)

```sql
-- Create extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- If needed, create the vector index:
-- CREATE INDEX idx_photos_embedding ON photos USING ivfflat (face_embedding vector_cosine_ops) WITH (lists = 100);
```

## Step 7: Update Environment Files

### Backend (`backend-ai/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=photos
FIREBASE_SERVICE_ACCOUNT=backend-ai/firebase-service-account.json
```

### Frontend (`frontend/.env.local`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=facevalue-9eb02.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=facevalue-9eb02
VITE_FIREBASE_STORAGE_BUCKET=facevalue-9eb02.appspot.com
```

## Step 8: Install Required Python Package

```bash
cd backend-ai
pip install supabase==2.0.0 python-multipart
```

## Step 9: Test Database Connection

Run this Python script in `backend-ai/`:

```python
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

client = create_client(supabase_url, supabase_key)

# Test connection
response = client.table("users").select("*").limit(1).execute()
print("✅ Supabase connection successful!")
print(f"Users table has {len(response.data)} records")
```

Run with: `python test_supabase.py`

## Step 10: Database Backup & Management

### Backup your database regularly:
1. Go to **Settings** → **Backups**
2. Enable **Automatic Backups** (daily)
3. View backup history anytime

### Monitor database usage:
1. **Reports** tab - View analytics
2. **Database** tab - Check storage usage
3. **API Usage** - Monitor request limits

## Common Operations

### View data:
```
Settings → SQL Editor → Write queries
```

### Reset database:
```sql
-- Drop all tables and start fresh
DROP TABLE IF EXISTS attention_check_results CASCADE;
DROP TABLE IF EXISTS attention_checks CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run all the SQL migration scripts above.

## Troubleshooting

**Error: "VECTOR extension not available"**
- Contact Supabase support or use a different data type for embeddings

**Error: "Permission denied" on storage uploads**
- Check RLS policies and storage bucket permissions

**Error: "Foreign key constraint violated"**
- Ensure parent records exist before inserting child records

**Database fills up quickly?**
- Check storage bucket usage in Reports tab
- Delete old test records and unused photos

## Next Steps

1. ✅ Database tables created
2. ✅ Storage bucket configured
3. ✅ RLS policies set up
4. ⏭️ Update backend services with database queries
5. ⏭️ Update frontend services with API calls
6. ⏭️ Test full workflow (upload → process → rate → retrieve)
