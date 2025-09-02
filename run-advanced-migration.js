// Script to run the advanced migration against Supabase manually
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://msfkfhspfjfchdiknayx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZmtmaHNwZmpmY2hkaWtuYXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjQxMjQsImV4cCI6MjA3MjQwMDEyNH0.5wLb54cmqi1qBwxQRveX2Xj9pNdeymasm1ZkyzP6YKI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdvancedTables() {
  try {
    console.log('🚀 Creating advanced BuJo Pro tables...');
    
    // Create entry_transitions table
    console.log('📊 Creating entry_transitions table...');
    const createTransitionsSQL = `
      CREATE TABLE IF NOT EXISTS public.entry_transitions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID,
        guest_user_id UUID REFERENCES public.guest_users(id) ON DELETE CASCADE,
        entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
        parent_entry_id UUID REFERENCES public.entries(id),
        transition_type TEXT NOT NULL,
        from_state JSONB,
        to_state JSONB,
        from_status TEXT,
        to_status TEXT,
        transition_reason TEXT,
        device_info JSONB,
        sync_metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT entry_transitions_user_check CHECK (
          (user_id IS NOT NULL AND guest_user_id IS NULL) OR 
          (user_id IS NULL AND guest_user_id IS NOT NULL)
        )
      );`;
    
    // Since we can't run raw SQL, let's create the table using the Supabase dashboard
    console.log('❌ Cannot create tables via API');
    console.log('✋ Please run the migration manually:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration script: 006_comprehensive_entry_tracking.sql');
    console.log('');
    console.log('Or use the Supabase CLI:');
    console.log('npx supabase db push');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createAdvancedTables();