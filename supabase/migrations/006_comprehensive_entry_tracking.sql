-- Comprehensive Entry Tracking for BuJo Pro Methodology
-- Adds complete transition tracking and iOS sync compatibility

-- Entry Transitions Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.entry_transitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification (supports both guest and authenticated users)
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  -- Entry identification
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  parent_entry_id UUID REFERENCES public.entries(id), -- For migration chains
  
  -- Transition details (BuJo Pro methodology compliance)
  transition_type TEXT NOT NULL CHECK (transition_type IN (
    -- Core BuJo state transitions
    'created',          -- Entry created
    'completed',        -- Task marked as done (X)
    'cancelled',        -- Task cancelled (strikethrough)
    'reopened',         -- Task uncompleted
    
    -- BuJo migrations
    'migrated',         -- Moved to future (>)
    'scheduled',        -- Moved to specific date (<)
    'deferred',         -- Pushed to future log
    
    -- Type conversions
    'converted',        -- Changed entry type
    
    -- Collection movements
    'moved',            -- Moved between collections
    'archived',         -- Moved to archive
    
    -- Edits and modifications
    'edited',           -- Content modified
    'edit_initiated',   -- Edit action started
    'priority_changed', -- Priority updated
    
    -- BuJo Pro advanced actions
    'investigated',     -- Research completed
    'shared',           -- Entry shared
    'gratitude_tagged', -- Added to gratitude log
    'made_private',     -- Made private/secure
    'deleted',          -- Entry deleted
    
    -- Organization actions
    'collection_assignment_initiated', -- Collection picker opened
    'photo_attachment_initiated',      -- Camera/photo picker opened
    
    -- iOS sync specific transitions
    'synced_to_reminders',   -- Synced with Apple Reminders
    'synced_to_calendar',    -- Synced with Apple Calendar
    'synced_from_reminders', -- Updated from Apple Reminders
    'synced_from_calendar'   -- Updated from Apple Calendar
  )),
  
  -- State tracking (complete entry snapshots)
  from_state JSONB, -- Complete entry state before transition
  to_state JSONB,   -- Complete entry state after transition
  
  -- Specific field changes
  from_status TEXT,
  to_status TEXT,
  from_type TEXT,
  to_type TEXT,
  from_collection_date DATE,
  to_collection_date DATE,
  from_collection_id UUID REFERENCES public.collections(id),
  to_collection_id UUID REFERENCES public.collections(id),
  
  -- Metadata and context
  transition_reason TEXT, -- Why the transition happened
  device_info JSONB,      -- Device/platform that made the change
  sync_metadata JSONB,    -- iOS sync specific data, swipe action info
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: must have either user_id OR guest_user_id
  CONSTRAINT entry_transitions_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- Migration Chains Table (BuJo Methodology)
CREATE TABLE IF NOT EXISTS public.migration_chains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  -- Chain identification
  chain_id UUID NOT NULL, -- Groups related migrations
  original_entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  current_entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  
  -- Migration metadata
  migration_count INTEGER DEFAULT 1,
  migration_path TEXT[], -- Array of dates it moved through
  migration_reasons TEXT[], -- Array of reasons for each migration
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT migration_chains_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  ),
  CONSTRAINT unique_chain_entry UNIQUE (chain_id, current_entry_id)
);

-- Entry State Snapshots (for audit and recovery)
CREATE TABLE IF NOT EXISTS public.entry_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  transition_id UUID REFERENCES public.entry_transitions(id) ON DELETE CASCADE,
  
  -- Complete state snapshot
  snapshot JSONB NOT NULL, -- Full entry data including tags, contexts, etc.
  snapshot_type TEXT CHECK (snapshot_type IN ('before', 'after', 'checkpoint')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- iOS Sync State Table (Apple ecosystem integration)
CREATE TABLE IF NOT EXISTS public.ios_sync_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  
  -- Apple ecosystem IDs
  apple_reminder_id TEXT,
  apple_calendar_id TEXT,
  apple_note_id TEXT,
  
  -- Sync state
  last_synced_at TIMESTAMPTZ,
  sync_direction TEXT CHECK (sync_direction IN ('to_ios', 'from_ios', 'bidirectional')),
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error')),
  conflict_data JSONB,
  
  -- Version tracking for conflict resolution
  local_version INTEGER DEFAULT 1,
  remote_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ios_sync_state_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  ),
  CONSTRAINT unique_entry_sync UNIQUE (entry_id)
);

-- Offline Sync Queue (Performance and reliability)
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
  
  -- Sync status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT sync_queue_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- Sync Conflicts Table (Multi-device conflict resolution)
CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- User identification
  user_id UUID,
  guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
  
  record_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  
  -- Conflict data
  local_version JSONB NOT NULL,
  remote_version JSONB NOT NULL,
  conflict_fields TEXT[], -- Which fields are in conflict
  
  -- Resolution
  resolution_strategy TEXT CHECK (resolution_strategy IN ('local_wins', 'remote_wins', 'manual', 'merge')),
  resolved_version JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT sync_conflicts_user_check CHECK (
    (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
    (user_id IS NULL AND guest_user_id IS NOT NULL)
  )
);

-- Performance Indexes for Transition Tables
CREATE INDEX IF NOT EXISTS idx_entry_transitions_entry ON public.entry_transitions (entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_transitions_user_guest ON public.entry_transitions (user_id, guest_user_id);
CREATE INDEX IF NOT EXISTS idx_entry_transitions_type ON public.entry_transitions (transition_type);
CREATE INDEX IF NOT EXISTS idx_entry_transitions_created ON public.entry_transitions (created_at);
CREATE INDEX IF NOT EXISTS idx_entry_transitions_entry_type ON public.entry_transitions (entry_id, transition_type);

CREATE INDEX IF NOT EXISTS idx_migration_chains_user_guest ON public.migration_chains (user_id, guest_user_id);
CREATE INDEX IF NOT EXISTS idx_migration_chains_original ON public.migration_chains (original_entry_id);
CREATE INDEX IF NOT EXISTS idx_migration_chains_current ON public.migration_chains (current_entry_id);
CREATE INDEX IF NOT EXISTS idx_migration_chains_chain_id ON public.migration_chains (chain_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_entry ON public.entry_snapshots (entry_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_transition ON public.entry_snapshots (transition_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON public.entry_snapshots (snapshot_type);

CREATE INDEX IF NOT EXISTS idx_ios_sync_user_guest ON public.ios_sync_state (user_id, guest_user_id);
CREATE INDEX IF NOT EXISTS idx_ios_sync_entry ON public.ios_sync_state (entry_id);
CREATE INDEX IF NOT EXISTS idx_ios_sync_status ON public.ios_sync_state (sync_status);
CREATE INDEX IF NOT EXISTS idx_ios_sync_reminder ON public.ios_sync_state (apple_reminder_id) WHERE apple_reminder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ios_sync_calendar ON public.ios_sync_state (apple_calendar_id) WHERE apple_calendar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_guest ON public.sync_queue (user_id, guest_user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue (sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON public.sync_queue (priority DESC, created_at ASC);

-- Helper Functions for BuJo Pro Methodology

-- Get complete entry history
CREATE OR REPLACE FUNCTION get_entry_history(p_entry_id UUID)
RETURNS TABLE (
  transition_type TEXT,
  from_status TEXT,
  to_status TEXT,
  from_date DATE,
  to_date DATE,
  created_at TIMESTAMPTZ,
  transition_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.transition_type,
    et.from_status,
    et.to_status,
    et.from_collection_date,
    et.to_collection_date,
    et.created_at,
    et.transition_reason
  FROM public.entry_transitions et
  WHERE et.entry_id = p_entry_id
  ORDER BY et.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get migration chain for entry
CREATE OR REPLACE FUNCTION get_migration_chain(p_entry_id UUID)
RETURNS TABLE (
  chain_id UUID,
  original_entry_id UUID,
  current_entry_id UUID,
  migration_count INTEGER,
  migration_path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.chain_id,
    mc.original_entry_id,
    mc.current_entry_id,
    mc.migration_count,
    mc.migration_path
  FROM public.migration_chains mc
  WHERE mc.original_entry_id = p_entry_id
     OR mc.current_entry_id = p_entry_id
  ORDER BY mc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at trigger for migration chains
CREATE TRIGGER update_migration_chains_updated_at 
BEFORE UPDATE ON public.migration_chains 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ios_sync_state_updated_at 
BEFORE UPDATE ON public.ios_sync_state 
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies (Permissive for guests, secure for authenticated users)
ALTER TABLE public.entry_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ios_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Transition policies
CREATE POLICY "Users can manage own entry transitions" ON public.entry_transitions FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

CREATE POLICY "Users can manage own migration chains" ON public.migration_chains FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

CREATE POLICY "Users can manage own snapshots" ON public.entry_snapshots FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.entries 
  WHERE entries.id = entry_snapshots.entry_id 
  AND (entries.user_id = auth.uid() OR entries.guest_user_id IS NOT NULL)
));

CREATE POLICY "Users can manage own iOS sync state" ON public.ios_sync_state FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

CREATE POLICY "Users can manage own sync queue" ON public.sync_queue FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

CREATE POLICY "Users can manage own sync conflicts" ON public.sync_conflicts FOR ALL 
USING (auth.uid() = user_id OR guest_user_id IS NOT NULL);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Comprehensive entry tracking schema created successfully!';
  RAISE NOTICE '📊 Entry transitions tracking: ALL swipe actions covered';
  RAISE NOTICE '🔗 Migration chains: BuJo Pro methodology compliance';
  RAISE NOTICE '📱 iOS sync state: Apple ecosystem integration ready';
  RAISE NOTICE '⚡ Performance optimized: Comprehensive indexing';
  RAISE NOTICE '🔒 Security: RLS policies with guest user support';
  RAISE NOTICE '';
  RAISE NOTICE 'BuJo Pro Features Enabled:';
  RAISE NOTICE '- Complete audit trail for all entry actions';
  RAISE NOTICE '- Migration chain tracking for BuJo methodology';
  RAISE NOTICE '- iOS sync compatibility with Apple Reminders/Calendar';
  RAISE NOTICE '- Offline-first sync queue for reliability';
  RAISE NOTICE '- Multi-device conflict resolution';
  RAISE NOTICE '- Entry state snapshots for recovery';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your BuJo app now has enterprise-grade entry tracking!';
END $$;