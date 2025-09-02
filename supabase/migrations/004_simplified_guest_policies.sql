-- Simplified Guest Policies for Testing
-- This creates more permissive policies to ensure data upload works

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can manage entries in their collections" ON public.entries;
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage their own signifiers" ON public.custom_signifiers;
DROP POLICY IF EXISTS "Users can manage their own scans" ON public.page_scans;
DROP POLICY IF EXISTS "Users can manage transitions for their entries" ON public.entry_transitions;
DROP POLICY IF EXISTS "Guests can manage their own record" ON public.guest_users;

-- Create simple, permissive policies for testing
-- In production, you'd want more specific security

-- Guest users table - allow all access
CREATE POLICY "Allow guest access" ON public.guest_users
  FOR ALL TO anon, authenticated
  USING (true);

-- Profiles - allow all access for testing
CREATE POLICY "Allow profile access" ON public.profiles
  FOR ALL TO anon, authenticated
  USING (true);

-- Collections - allow all access for testing
CREATE POLICY "Allow collection access" ON public.collections
  FOR ALL TO anon, authenticated
  USING (true);

-- Entries - allow all access for testing
CREATE POLICY "Allow entry access" ON public.entries
  FOR ALL TO anon, authenticated
  USING (true);

-- Tags - allow all access for testing
CREATE POLICY "Allow tag access" ON public.tags
  FOR ALL TO anon, authenticated
  USING (true);

-- Custom Signifiers - allow all access for testing
CREATE POLICY "Allow signifier access" ON public.custom_signifiers
  FOR ALL TO anon, authenticated
  USING (true);

-- Page Scans - allow all access for testing
CREATE POLICY "Allow scan access" ON public.page_scans
  FOR ALL TO anon, authenticated
  USING (true);

-- Entry Transitions - allow all access for testing
CREATE POLICY "Allow transition access" ON public.entry_transitions
  FOR ALL TO anon, authenticated
  USING (true);

-- Ensure permissions are granted
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Comment explaining this is for testing
COMMENT ON POLICY "Allow collection access" ON public.collections IS 
'Simplified policy for testing. Replace with proper security policies in production.';

-- Show what policies are now active
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;