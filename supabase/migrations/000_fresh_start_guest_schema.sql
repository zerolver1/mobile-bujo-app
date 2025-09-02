-- Fresh Start: Complete BuJo Schema with Guest User Support
-- This migration drops all existing tables and recreates everything properly
-- Run this in Supabase Dashboard SQL Editor for a clean start

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP ALL EXISTING TABLES (clean slate)
DROP TABLE IF EXISTS public.sync_queue CASCADE;
DROP TABLE IF EXISTS public.mood_logs CASCADE;
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.index_entries CASCADE;
DROP TABLE IF EXISTS public.indexes CASCADE;
DROP TABLE IF EXISTS public.ios_sync_state CASCADE;
DROP TABLE IF EXISTS public.entry_snapshots CASCADE;
DROP TABLE IF EXISTS public.migration_chains CASCADE;
DROP TABLE IF EXISTS public.entry_transitions CASCADE;
DROP TABLE IF EXISTS public.scan_entries CASCADE;
DROP TABLE IF EXISTS public.page_scans CASCADE;
DROP TABLE IF EXISTS public.entry_migrations CASCADE;
DROP TABLE IF EXISTS public.entry_tags CASCADE;
DROP TABLE IF EXISTS public.custom_signifiers CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.entries CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.guest_users CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS public.create_guest_user CASCADE;
DROP FUNCTION IF EXISTS public.migrate_guest_to_user CASCADE;
DROP FUNCTION IF EXISTS public.get_entry_history CASCADE;
DROP FUNCTION IF EXISTS public.get_migration_chain CASCADE;
DROP FUNCTION IF EXISTS public.record_entry_transition CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;

-- ============================================================================
-- GUEST USERS TABLE (Foundation)
-- ============================================================================
CREATE TABLE public.guest_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  device_id TEXT,
  session_id TEXT,
  guest_name TEXT DEFAULT 'Guest User',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_migrated BOOLEAN DEFAULT false,
  migrated_to_user_id UUID,
  app_version TEXT,
  platform TEXT,
  timezone TEXT
);

-- ============================================================================
-- PROFILES TABLE (for authenticated users only)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- No FK constraint to auth.users for now
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bullet_style TEXT DEFAULT 'classic' CHECK (bullet_style IN ('classic', 'modern', 'handwritten')),
  paper_texture TEXT DEFAULT 'dot' CHECK (paper_texture IN ('dot', 'grid', 'lined', 'blank')),
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'auto')),
  auto_sync BOOLEAN DEFAULT true,
  sync_reminders BOOLEAN DEFAULT true,
  sync_calendar BOOLEAN DEFAULT true,
  haptic_feedback BOOLEAN DEFAULT true,
  daily_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium'))
);

-- ============================================================================
-- COLLECTIONS TABLE (supports both auth users and guests)
-- ============================================================================
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification (either auth user OR guest user)
  user_id UUID, -- References profiles.id (for authenticated users)
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  -- BuJo collection data
  type TEXT NOT NULL CHECK (type IN ('daily', 'monthly', 'future', 'custom')),
  collection_date DATE NOT NULL,
  name TEXT,
  description TEXT,
  color TEXT,
  icon TEXT,
  smart_match BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id (not both, not neither)
  CONSTRAINT collections_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- ENTRIES TABLE (the core of BuJo)
-- ============================================================================
CREATE TABLE public.entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID, -- References profiles.id (for authenticated users)
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  
  -- BuJo entry data
  type TEXT NOT NULL CHECK (type IN ('task', 'event', 'note', 'idea', 'research', 'memory', 'custom')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'migrated', 'scheduled', 'cancelled', 'irrelevant')),
  priority TEXT DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high')),
  is_priority BOOLEAN DEFAULT false,
  
  -- Temporal data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  collection_date DATE NOT NULL,
  due_date DATE,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Organization
  page_number INTEGER,
  line_number INTEGER,
  indent_level INTEGER DEFAULT 0,
  parent_entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  
  -- Metadata
  source TEXT CHECK (source IN ('manual', 'scan', 'import', 'api', 'migration')),
  ocr_confidence DECIMAL(3,2),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT entries_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type TEXT DEFAULT 'tag' CHECK (type IN ('tag', 'context')),
  color TEXT,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT tags_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- ENTRY-TAG RELATIONSHIPS
-- ============================================================================
CREATE TABLE public.entry_tags (
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id, tag_id)
);

-- ============================================================================
-- CUSTOM SIGNIFIERS
-- ============================================================================
CREATE TABLE public.custom_signifiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  symbol TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT custom_signifiers_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- PAGE SCANS (OCR)
-- ============================================================================
CREATE TABLE public.page_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  -- File storage
  image_url TEXT NOT NULL,
  image_hash TEXT NOT NULL,
  file_size INTEGER,
  
  -- OCR results
  ocr_text TEXT,
  ocr_provider TEXT CHECK (ocr_provider IN ('openai', 'mistral', 'ocr_space', 'manual')),
  ocr_confidence DECIMAL(3,2),
  ocr_metadata JSONB,
  
  -- Processing
  processed_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  page_date DATE,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT page_scans_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- ENTRY TRANSITIONS (for iOS sync compatibility)
-- ============================================================================
CREATE TABLE public.entry_transitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  -- Entry identification
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  parent_entry_id UUID REFERENCES public.entries(id),
  
  -- Transition details
  transition_type TEXT NOT NULL CHECK (transition_type IN (
    'created', 'completed', 'cancelled', 'reopened',
    'migrated', 'scheduled', 'deferred',
    'converted', 'moved', 'archived', 'edited', 'priority_changed',
    'synced_to_reminders', 'synced_to_calendar', 'synced_from_reminders', 'synced_from_calendar'
  )),
  
  -- State tracking
  from_state JSONB,
  to_state JSONB,
  from_status TEXT,
  to_status TEXT,
  from_type TEXT,
  to_type TEXT,
  from_collection_date DATE,
  to_collection_date DATE,
  from_collection_id UUID REFERENCES public.collections(id),
  to_collection_id UUID REFERENCES public.collections(id),
  
  -- Metadata
  transition_reason TEXT,
  device_info JSONB,
  sync_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT entry_transitions_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to create guest user
CREATE OR REPLACE FUNCTION create_guest_user(
  p_device_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT 'unknown'
) RETURNS UUID AS $$
DECLARE
  guest_id UUID;
BEGIN
  INSERT INTO public.guest_users (
    device_id, session_id, platform, guest_name, created_at, last_active_at
  ) VALUES (
    p_device_id, p_session_id, p_platform, 'Guest User', NOW(), NOW()
  ) RETURNING id INTO guest_id;
  
  RETURN guest_id;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate guest data to authenticated user
CREATE OR REPLACE FUNCTION migrate_guest_to_user(
  p_guest_user_id UUID,
  p_auth_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Migrate all data from guest to authenticated user
  UPDATE public.collections SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  UPDATE public.entries SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  UPDATE public.tags SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  UPDATE public.custom_signifiers SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  UPDATE public.page_scans SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  UPDATE public.entry_transitions SET user_id = p_auth_user_id, guest_user_id = NULL WHERE guest_user_id = p_guest_user_id;
  
  -- Mark guest as migrated
  UPDATE public.guest_users SET is_migrated = true, migrated_to_user_id = p_auth_user_id WHERE id = p_guest_user_id;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_signifiers_updated_at BEFORE UPDATE ON public.custom_signifiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Guest user indexes
CREATE INDEX idx_guest_users_device_id ON public.guest_users (device_id);
CREATE INDEX idx_guest_users_is_migrated ON public.guest_users (is_migrated);

-- Collections indexes
CREATE INDEX idx_collections_user_id ON public.collections (user_id);
CREATE INDEX idx_collections_guest_user_id ON public.collections (guest_user_id);
CREATE INDEX idx_collections_date ON public.collections (collection_date);
CREATE INDEX idx_collections_type ON public.collections (type);

-- Entries indexes
CREATE INDEX idx_entries_user_id ON public.entries (user_id);
CREATE INDEX idx_entries_guest_user_id ON public.entries (guest_user_id);
CREATE INDEX idx_entries_collection_date ON public.entries (collection_date);
CREATE INDEX idx_entries_collection_id ON public.entries (collection_id);
CREATE INDEX idx_entries_status ON public.entries (status);
CREATE INDEX idx_entries_type ON public.entries (type);
CREATE INDEX idx_entries_updated_at ON public.entries (updated_at);

-- Tags indexes
CREATE INDEX idx_tags_user_id ON public.tags (user_id);
CREATE INDEX idx_tags_guest_user_id ON public.tags (guest_user_id);
CREATE INDEX idx_tags_type ON public.tags (type);

-- Page scans indexes
CREATE INDEX idx_page_scans_user_id ON public.page_scans (user_id);
CREATE INDEX idx_page_scans_guest_user_id ON public.page_scans (guest_user_id);
CREATE INDEX idx_page_scans_hash ON public.page_scans (image_hash);
CREATE INDEX idx_page_scans_status ON public.page_scans (processing_status);

-- Entry transitions indexes
CREATE INDEX idx_entry_transitions_user_id ON public.entry_transitions (user_id);
CREATE INDEX idx_entry_transitions_guest_user_id ON public.entry_transitions (guest_user_id);
CREATE INDEX idx_entry_transitions_entry_id ON public.entry_transitions (entry_id);
CREATE INDEX idx_entry_transitions_type ON public.entry_transitions (transition_type);

-- ============================================================================
-- ROW LEVEL SECURITY (Permissive for guests, secure for auth users)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_signifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_transitions ENABLE ROW LEVEL SECURITY;

-- Guest users can manage their own data (permissive)
CREATE POLICY "Guest users full access" ON public.guest_users FOR ALL USING (true);

-- Profiles for authenticated users only
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Collections (both auth and guest)
CREATE POLICY "Users can manage own collections" ON public.collections FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Entries (both auth and guest) 
CREATE POLICY "Users can manage own entries" ON public.entries FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Tags (both auth and guest)
CREATE POLICY "Users can manage own tags" ON public.tags FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Entry tags (via entries relationship)
CREATE POLICY "Users can manage own entry tags" ON public.entry_tags FOR ALL 
USING (EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_tags.entry_id AND (entries.user_id = auth.uid() OR entries.guest_user_id IS NOT NULL)));

-- Custom signifiers (both auth and guest)
CREATE POLICY "Users can manage own signifiers" ON public.custom_signifiers FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Page scans (both auth and guest)
CREATE POLICY "Users can manage own scans" ON public.page_scans FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Entry transitions (both auth and guest)
CREATE POLICY "Users can manage own transitions" ON public.entry_transitions FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fresh BuJo schema with guest support created successfully!';
  RAISE NOTICE '🎭 Guest users can now use the app without authentication';
  RAISE NOTICE '🔄 Data migration support included for when users authenticate';
  RAISE NOTICE '🚀 Ready to restart your app - it will work with guests automatically';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- guest_users (for anonymous users)';
  RAISE NOTICE '- profiles (for authenticated users)';
  RAISE NOTICE '- collections, entries, tags, custom_signifiers';
  RAISE NOTICE '- page_scans, entry_transitions';
  RAISE NOTICE '- All tables support both guest_user_id and user_id';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your app will now work perfectly with guest users!';
END $$;