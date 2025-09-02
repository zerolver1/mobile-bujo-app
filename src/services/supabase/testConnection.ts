import { supabase, features } from './client';

export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('Cloud sync enabled:', features.cloudSync);
  console.log('Realtime enabled:', features.realtime);

  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return false;
  }

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01') {
        console.warn('⚠️ Tables not created yet. Please run the migration SQL in Supabase dashboard.');
        console.log('Migration file: /supabase/migrations/001_bujo_core_schema.sql');
        return false;
      }
      
      console.error('❌ Connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    
    // Test auth status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Authenticated as:', user.email);
    } else {
      console.log('ℹ️ Not authenticated (anonymous access)');
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testSupabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}