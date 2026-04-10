-- Drop existing restrictive policies
DROP POLICY IF EXISTS insert_own_history ON search_history;
DROP POLICY IF EXISTS select_own_history ON search_history;
DROP POLICY IF EXISTS update_own_history ON search_history;

-- Create new policies for anonymous public access
CREATE POLICY "anon_insert_history" ON search_history 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_history" ON search_history 
  FOR SELECT USING (true);

CREATE POLICY "public_update_history" ON search_history 
  FOR UPDATE USING (true);

-- Update news_sources policies to allow anonymous insert
DROP POLICY IF EXISTS auth_insert_sources ON news_sources;

CREATE POLICY "anon_insert_sources" ON news_sources 
  FOR INSERT WITH CHECK (true);