import { supabase } from './client';

/**
 * Automated Supabase Database Setup
 * Uses the Supabase API to create tables and apply migrations
 */

export async function setupSupabaseDatabase() {
  console.log('🚀 Starting Supabase database setup...');

  if (!supabase) {
    console.error('❌ Supabase client not configured. Please check your environment variables.');
    return false;
  }

  try {
    // Check if we're authenticated (for admin operations)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('ℹ️ Not authenticated (using anonymous access)');
    }

    // Step 1: Check if tables already exist (silently)
    const tablesExist = await checkTablesExist();
    
    if (tablesExist) {
      console.log('✅ Cloud database connected and ready');
      return true;
    } else {
      console.log('📦 Database setup required');
      console.log('📝 Note: Table creation requires running migrations in Supabase Dashboard.');
      console.log('    Please run the following migrations:');
      console.log('    1. /supabase/migrations/001_bujo_core_schema.sql');
      console.log('    2. /supabase/migrations/002_entry_transitions.sql');
    }

    // Step 2: Create storage buckets
    console.log('🗂️ Setting up storage buckets...');
    await setupStorageBuckets();

    // Step 3: Verify setup
    console.log('🔍 Verifying setup...');
    const isValid = await verifySetup();

    if (isValid) {
      console.log('✅ Supabase database setup completed successfully!');
      return true;
    } else {
      console.log('⚠️ Running with limited functionality');
      console.log('    To enable full cloud sync:');
      console.log('    1. Go to Supabase Dashboard');
      return false;
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

async function checkTablesExist(): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Try to query the profiles table
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    // If no error or specific "no rows" error, table exists
    if (!error || error.code === 'PGRST116') {
      return true;
    }

    // Table doesn't exist error
    if (error.code === '42P01') {
      return false;
    }

    // Some other error
    console.warn('Warning checking tables:', error.message);
    return false;
  } catch (error) {
    return false;
  }
}

async function createTablesFromMigrations() {
  if (!supabase) return;

  try {
    // Note: Supabase doesn't allow direct DDL via client SDK in React Native
    // You need to use the Management API or Dashboard
    
    console.log('📝 Note: Table creation requires running migrations in Supabase Dashboard.');
    console.log('   Please run the following migrations:');
    console.log('   1. /supabase/migrations/001_bujo_core_schema.sql');
    console.log('   2. /supabase/migrations/002_entry_transitions.sql');
    
    // Alternative: Use Supabase Management API (requires service role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await executeWithServiceRole();
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

async function executeWithServiceRole() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !projectUrl) {
    console.log('⚠️ Service role key not available. Manual migration required.');
    return;
  }

  // Use fetch to call Supabase Management API
  const response = await fetch(`${projectUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'SELECT 1' // Test query
    }),
  });

  if (response.ok) {
    console.log('✅ Service role access confirmed');
  }
}

async function applyMigrations() {
  if (!supabase) return;

  // Check which migrations have been applied
  try {
    // Check for transition tables (from migration 002)
    const { error } = await supabase
      .from('entry_transitions')
      .select('count')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('📝 Migration 002 needs to be applied');
      console.log('   Run: /supabase/migrations/002_entry_transitions.sql');
    } else {
      console.log('✅ All migrations applied');
    }
  } catch (error) {
    console.error('Error checking migrations:', error);
  }
}

async function setupStorageBuckets() {
  if (!supabase) return;

  console.log('🗂️ Checking storage buckets (manual creation required for RLS)...');
  
  const buckets = ['page-scans', 'avatars', 'memory-photos'];

  for (const bucketName of buckets) {
    try {
      // Just check if bucket exists
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
      
      if (existingBucket) {
        console.log(`✅ Bucket '${bucketName}' already exists`);
      } else {
        console.log(`⚠️ Bucket '${bucketName}' needs to be created manually in Supabase Dashboard`);
      }
    } catch (error) {
      console.log(`ℹ️ Bucket '${bucketName}' not found (create manually if needed)`);
    }
  }
  
  console.log('📝 To create storage buckets:');
  console.log('   1. Go to Supabase Dashboard > Storage');
  console.log('   2. Create buckets: page-scans (private), avatars (public), memory-photos (private)');
}

async function verifySetup(): Promise<boolean> {
  if (!supabase) return false;

  const checks = [
    { table: 'profiles', name: 'User Profiles' },
    { table: 'collections', name: 'Collections' },
    { table: 'entries', name: 'Entries' },
    { table: 'tags', name: 'Tags' },
    { table: 'custom_signifiers', name: 'Custom Signifiers' },
    { table: 'page_scans', name: 'Page Scans' },
  ];

  let allValid = true;

  for (const check of checks) {
    try {
      const { error } = await supabase
        .from(check.table)
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        // Silently track missing tables instead of logging errors
        allValid = false;
      }
      // Don't log individual table status to reduce noise
    } catch (error) {
      allValid = false;
    }
  }

  return allValid;
}

// Test connection and setup
export async function testAndSetup() {
  console.log('🔧 Testing Supabase connection and setup...\n');

  // Test basic connection
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    console.log('   Please check your .env.development file');
    return false;
  }

  console.log('✅ Supabase client initialized');
  console.log(`📍 URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL}`);
  console.log(`🔐 Anon Key: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  
  // Check auth status
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log(`✅ Authenticated as: ${user.email}`);
  } else {
    console.log('ℹ️ Not authenticated (using anonymous access)');
  }

  // Run setup
  const success = await setupSupabaseDatabase();
  
  if (success) {
    console.log('\n🎉 Supabase is ready for BuJo sync!');
    console.log('   Cloud sync is', process.env.EXPO_PUBLIC_ENABLE_CLOUD_SYNC === 'true' ? 'ENABLED' : 'DISABLED');
    console.log('   Realtime is', process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true' ? 'ENABLED' : 'DISABLED');
  } else {
    console.log('\n⚠️ Manual setup required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run migrations from /supabase/migrations/');
    console.log('4. Create storage buckets: page-scans, avatars, memory-photos');
  }

  return success;
}

// Export for use in app initialization
export default {
  setup: setupSupabaseDatabase,
  test: testAndSetup,
  verify: verifySetup,
};