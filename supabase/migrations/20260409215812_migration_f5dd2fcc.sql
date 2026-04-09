-- News sources table
CREATE TABLE news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  country TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('business', 'organization', 'government', 'education', 'media', 'community', 'facility', 'authority', 'club', 'other')),
  topic_focus TEXT[] DEFAULT '{}',
  community_importance INTEGER CHECK (community_importance >= 1 AND community_importance <= 10),
  news_frequency TEXT CHECK (news_frequency IN ('daily', 'weekly', 'monthly', 'occasional', 'rare', 'unknown')),
  description TEXT,
  contact_info JSONB DEFAULT '{}',
  last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  sources_found INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Source categories junction table
CREATE TABLE source_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, category)
);

-- Enable RLS
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read, authenticated write (T2)
CREATE POLICY "public_read_sources" ON news_sources FOR SELECT USING (true);
CREATE POLICY "auth_insert_sources" ON news_sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_sources" ON news_sources FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_sources" ON news_sources FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "select_own_history" ON search_history FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "insert_own_history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "update_own_history" ON search_history FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "public_read_categories" ON source_categories FOR SELECT USING (true);
CREATE POLICY "auth_write_categories" ON source_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_categories" ON source_categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_categories" ON source_categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_news_sources_location ON news_sources(country, zip_code);
CREATE INDEX idx_news_sources_type ON news_sources(source_type);
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_source_categories_source ON source_categories(source_id);