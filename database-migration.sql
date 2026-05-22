-- ============================================================================
-- FaceRating Platform - Supabase Database Schema
-- ============================================================================
-- Execute this entire file in Supabase SQL Editor to set up all tables
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 2. SURVEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  photo_ids TEXT[],
  participant_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Survey Settings
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

CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);

-- ============================================================================
-- 3. PERSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  person_code TEXT NOT NULL,
  completion_percentage FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(survey_id, person_code)
);

CREATE INDEX IF NOT EXISTS idx_persons_survey_id ON persons(survey_id);
CREATE INDEX IF NOT EXISTS idx_persons_person_code ON persons(person_code);

-- ============================================================================
-- 4. PHOTOS TABLE
-- ============================================================================
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
  face_embedding VECTOR(512),
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

CREATE INDEX IF NOT EXISTS idx_photos_survey_id ON photos(survey_id);
CREATE INDEX IF NOT EXISTS idx_photos_person_id ON photos(person_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_has_face ON photos(has_face);

-- ============================================================================
-- 5. PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('in-progress', 'completed', 'abandoned', 'flagged')) DEFAULT 'in-progress',
  photo_order TEXT[],
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

CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_survey_id ON participants(survey_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_is_suspicious ON participants(is_suspicious);

-- ============================================================================
-- 6. RATINGS TABLE (Reviews/Feedback)
-- ============================================================================
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
  
  -- Edit history stored as JSONB
  edit_history JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(participant_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_survey_id ON ratings(survey_id);
CREATE INDEX IF NOT EXISTS idx_ratings_participant_id ON ratings(participant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_photo_id ON ratings(photo_id);
CREATE INDEX IF NOT EXISTS idx_ratings_person_id ON ratings(person_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- ============================================================================
-- 7. ATTENTION CHECKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attention_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  required_rating INTEGER NOT NULL,
  failure_action TEXT CHECK (failure_action IN ('warn', 'flag', 'disqualify')) DEFAULT 'warn',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attention_checks_survey_id ON attention_checks(survey_id);
CREATE INDEX IF NOT EXISTS idx_attention_checks_photo_id ON attention_checks(photo_id);

-- ============================================================================
-- 8. ATTENTION CHECK RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attention_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES attention_checks(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  given_rating FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attention_check_results_participant_id ON attention_check_results(participant_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Enable Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_check_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = uid OR role = 'admin');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = uid);

-- Surveys policies
CREATE POLICY "Surveys readable by authenticated users" ON surveys
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage surveys" ON surveys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Photos policies
CREATE POLICY "Photos readable to survey participants" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.survey_id = photos.survey_id
      AND participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage photos" ON photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Ratings policies
CREATE POLICY "Users can read own ratings" ON ratings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ratings" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON ratings
  FOR UPDATE USING (user_id = auth.uid());

-- Participants policies
CREATE POLICY "Users can read own participant records" ON participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own participant record" ON participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant record" ON participants
  FOR UPDATE USING (user_id = auth.uid());

-- Persons policies
CREATE POLICY "Persons readable to authenticated users" ON persons
  FOR SELECT USING (auth.role() = 'authenticated');

-- Attention checks policies
CREATE POLICY "Attention checks readable to participants" ON attention_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = attention_checks.survey_id
    )
  );

CREATE POLICY "Attention check results readable to user" ON attention_check_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = participant_id
      AND participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own attention check results" ON attention_check_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = participant_id
      AND participants.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to update user quality score after rating submission
CREATE OR REPLACE FUNCTION update_user_quality_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET quality_score = (
    SELECT AVG(quality_score) FROM participants WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating quality score
DROP TRIGGER IF EXISTS update_quality_score_trigger ON ratings;
CREATE TRIGGER update_quality_score_trigger
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_quality_score();

-- Function to update survey completion count
CREATE OR REPLACE FUNCTION update_survey_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE surveys SET completed_count = completed_count + 1 WHERE id = NEW.survey_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating survey completion count
DROP TRIGGER IF EXISTS update_survey_completion_trigger ON participants;
CREATE TRIGGER update_survey_completion_trigger
AFTER UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION update_survey_completion_count();

-- ============================================================================
-- SUCCESS
-- ============================================================================
-- Schema setup complete! All tables, indexes, and policies are in place.
