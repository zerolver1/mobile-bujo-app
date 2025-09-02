-- Insert Existing Guest User ID
-- This ensures the guest user ID already stored in the app has a corresponding database record

-- Insert the guest user that the app is already using
INSERT INTO public.guest_users (
  id,
  device_id,
  session_id,
  guest_name,
  created_at,
  last_active_at,
  platform,
  app_version
) VALUES (
  '04f775b6-9356-4596-b7d7-0942b860f582',
  'unknown_device',
  'unknown_session', 
  'Guest User',
  NOW(),
  NOW(),
  'ios',
  '1.0.0'
) ON CONFLICT (id) DO UPDATE SET
  last_active_at = NOW();

-- Verify the guest user was created
DO $$
DECLARE
  guest_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO guest_count FROM public.guest_users WHERE id = '04f775b6-9356-4596-b7d7-0942b860f582';
  
  IF guest_count > 0 THEN
    RAISE NOTICE '✅ Guest user 04f775b6-9356-4596-b7d7-0942b860f582 created successfully!';
  ELSE
    RAISE NOTICE '❌ Failed to create guest user';
  END IF;
END $$;