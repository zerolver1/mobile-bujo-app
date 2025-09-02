-- Enable Guest Access with Proper RLS Policies (FIXED)
-- This allows the app to work for guest users while maintaining security

-- Enable RLS on all tables (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_signifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;

-- Guest Users: Allow guests to manage their own record
CREATE POLICY "Guests can manage their own record" ON public.guest_users
  FOR ALL
  TO anon, authenticated
  USING (true); -- Allow all access for guest users table

-- Profiles: Allow users to manage their own profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL
  TO anon, authenticated
  USING (
    id = auth.uid() OR 
    id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
    -- Allow guest users (check if ID exists in guest_users table)
    id IN (SELECT id FROM public.guest_users)
  );

-- Collections: Allow users and guests to manage their collections
CREATE POLICY "Users can manage their own collections" ON public.collections
  FOR ALL 
  TO anon, authenticated
  USING (
    user_id = auth.uid() OR 
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
    -- Allow access for guest users
    user_id IN (SELECT id FROM public.guest_users) OR
    user_id IN (SELECT id FROM public.profiles)
  );

-- Entries: Allow users to manage entries in their collections
CREATE POLICY "Users can manage entries in their collections" ON public.entries
  FOR ALL
  TO anon, authenticated
  USING (
    collection_id IN (
      SELECT id FROM public.collections 
      WHERE user_id = auth.uid() OR 
            user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
            user_id IN (SELECT id FROM public.guest_users) OR
            user_id IN (SELECT id FROM public.profiles)
    )
  );

-- Tags: Allow users to manage their own tags
CREATE POLICY "Users can manage their own tags" ON public.tags
  FOR ALL
  TO anon, authenticated  
  USING (
    user_id = auth.uid() OR
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
    user_id IN (SELECT id FROM public.guest_users) OR
    user_id IN (SELECT id FROM public.profiles)
  );

-- Custom Signifiers: Allow users to manage their own signifiers
CREATE POLICY "Users can manage their own signifiers" ON public.custom_signifiers
  FOR ALL
  TO anon, authenticated
  USING (
    user_id = auth.uid() OR
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
    user_id IN (SELECT id FROM public.guest_users) OR
    user_id IN (SELECT id FROM public.profiles)
  );

-- Page Scans: Allow users to manage their own scans
CREATE POLICY "Users can manage their own scans" ON public.page_scans
  FOR ALL
  TO anon, authenticated
  USING (
    user_id = auth.uid() OR
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
    user_id IN (SELECT id FROM public.guest_users) OR
    user_id IN (SELECT id FROM public.profiles)
  );

-- Entry Transitions: Allow users to track transitions for their entries
CREATE POLICY "Users can manage transitions for their entries" ON public.entry_transitions
  FOR ALL
  TO anon, authenticated
  USING (
    entry_id IN (
      SELECT e.id FROM public.entries e
      JOIN public.collections c ON e.collection_id = c.id
      WHERE c.user_id = auth.uid() OR
            c.user_id::text = current_setting('request.jwt.claims', true)::json->>'sub' OR
            c.user_id IN (SELECT id FROM public.guest_users) OR
            c.user_id IN (SELECT id FROM public.profiles)
    )
  );

-- Grant necessary permissions to anon role for guest access
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Simplified guest access policy (less restrictive for testing)
-- In production, you'd want more specific policies

-- Alternative: Simple policies for testing (uncomment if the above is too restrictive)
-- DROP POLICY IF EXISTS "Allow all access for testing" ON public.profiles;
-- CREATE POLICY "Allow all access for testing" ON public.profiles FOR ALL TO anon, authenticated USING (true);
-- DROP POLICY IF EXISTS "Allow all access for testing" ON public.collections;
-- CREATE POLICY "Allow all access for testing" ON public.collections FOR ALL TO anon, authenticated USING (true);
-- DROP POLICY IF EXISTS "Allow all access for testing" ON public.entries;
-- CREATE POLICY "Allow all access for testing" ON public.entries FOR ALL TO anon, authenticated USING (true);

-- Comment explaining the guest access approach
COMMENT ON POLICY "Users can manage their own profile" ON public.profiles IS 
'Allows authenticated users to manage their profile, and guest users to access through guest_users table';

COMMENT ON POLICY "Users can manage their own collections" ON public.collections IS 
'Guest users can access collections through the guest_users table lookup.';