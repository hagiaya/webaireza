-- Migration to initialize the Ara Studio AI Influencer schema

-- 1. Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT, -- 'html','css','javascript','react','python'
  trending_score INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,    -- 'html','css','javascript','react','python','tips'
  hook TEXT,        -- kalimat pembuka viral
  cta TEXT,         -- call to action penutup
  duration_estimate INTEGER, -- estimasi detik
  slot INTEGER,     -- 1=pagi, 2=siang, 3=malam
  status TEXT DEFAULT 'draft', -- draft/ready/used
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create audios table
CREATE TABLE IF NOT EXISTS audios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  voice TEXT DEFAULT 'nova',
  duration INTEGER,
  status TEXT DEFAULT 'pending', -- pending/generated/failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create content_calendar table
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_id UUID REFERENCES audios(id) ON DELETE SET NULL,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  platform TEXT NOT NULL, -- tiktok/instagram/youtube
  caption TEXT,
  hashtags TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled/posted/skipped
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  platform TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  audio_id UUID REFERENCES audios(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  template_type TEXT DEFAULT 'coding_neon', -- coding_neon, retro_terminal, cyber_matrix
  video_metadata JSONB, -- size, resolution, duration
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Setup storage bucket for 'audios' & 'videos'
-- Note: Run these statements in Supabase to create the buckets and enable public access policies.
-- In Supabase dashboard:
-- 1. Create a Public bucket named 'audios'
-- 2. Create a Public bucket named 'videos'
-- Or run the following SQL if storage schema is accessible:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audios', 'audios', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "Public Access Audios" ON storage.objects FOR SELECT USING (bucket_id = 'audios');
-- CREATE POLICY "Public Upload Audios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audios');
-- CREATE POLICY "Public Access Videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
-- CREATE POLICY "Public Upload Videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');
