-- Enable RLS on photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Admins can insert photos
CREATE POLICY "admins_upload_photos" ON photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Admins can update photos
CREATE POLICY "admins_update_photos" ON photos
FOR UPDATE
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Admins can delete photos
CREATE POLICY "admins_delete_photos" ON photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- All authenticated users can view photos
CREATE POLICY "users_view_photos" ON photos
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable RLS on surveys table
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Admins can create surveys
CREATE POLICY "admins_create_surveys" ON surveys
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Admins can update surveys
CREATE POLICY "admins_update_surveys" ON surveys
FOR UPDATE
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Admins can delete surveys
CREATE POLICY "admins_delete_surveys" ON surveys
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- All authenticated users can view surveys
CREATE POLICY "users_view_surveys" ON surveys
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable RLS on ratings table
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Users can insert ratings
CREATE POLICY "users_insert_ratings" ON ratings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Users can view their own ratings
CREATE POLICY "users_view_own_ratings" ON ratings
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all ratings
CREATE POLICY "admins_view_all_ratings" ON ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
