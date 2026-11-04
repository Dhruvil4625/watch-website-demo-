-- ============================================================================
-- MAISON GUJARAT TIME COMPANY — PASSWORD RESET & RECOVERY FLOW
-- Run this script in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================================

-- 1. Enable Crypto Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure Admin Users Table Exists (Safe Creation)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'co-owner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create Password Reset Requests Table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Deny all direct client queries; only SECURITY DEFINER functions may access
DROP POLICY IF EXISTS "No direct client access to password_reset_requests" ON public.password_reset_requests;
CREATE POLICY "No direct client access to password_reset_requests"
  ON public.password_reset_requests
  FOR ALL
  USING (false);

-- ============================================================================
-- 4. RPC: GENERATE 6-DIGIT PASSWORD RESET OTP (FOR ADMIN OR CUSTOMER)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.request_password_reset_otp(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_full_name TEXT;
  v_is_admin BOOLEAN := false;
  v_otp TEXT;
  v_req_id UUID;
BEGIN
  -- 1. Purge expired or used reset requests
  DELETE FROM public.password_reset_requests
  WHERE expires_at < NOW() OR is_used = true;

  -- 2. Locate user in Supabase auth.users
  SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_user_id, v_full_name
  FROM auth.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No collector or admin account found with this email address.';
  END IF;

  -- 3. Check if this account belongs to one of the 3 Co-Owner Admins
  v_is_admin := (v_clean_email IN (
    'ramoliadk@gmail.com',
    'gujarattimecompany@gmail.com',
    'gujrattimecompany@gmail.com',
    'parthsherathiya181@gmail.com'
  ));

  IF NOT v_is_admin AND to_regclass('public.admin_users') IS NOT NULL THEN
    BEGIN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = $1 OR LOWER(email) = $2)'
        INTO v_is_admin
        USING v_user_id, v_clean_email;
    EXCEPTION WHEN OTHERS THEN
      v_is_admin := false;
    END;
  END IF;

  -- 4. Generate a 6-digit recovery OTP (expires in 2 minutes)
  v_otp := LPAD((floor(random() * 900000) + 100000)::text, 6, '0');

  INSERT INTO public.password_reset_requests (
    user_id, user_email, otp_hash, expires_at
  ) VALUES (
    v_user_id, v_clean_email, crypt(v_otp, gen_salt('bf')), NOW() + INTERVAL '2 minutes'
  )
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object(
    'resetId', v_req_id,
    'email', v_clean_email,
    'userName', v_full_name,
    'isAdmin', v_is_admin,
    'otp', v_otp,
    'expiresInSeconds', 120
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.request_password_reset_otp(TEXT) TO anon, authenticated;

-- ============================================================================
-- 5. RPC: VERIFY OTP & AUTOMATICALLY UPDATE PASSWORD IN auth.users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_and_update_password(
  p_reset_id UUID,
  p_email TEXT,
  p_otp TEXT,
  p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_req public.password_reset_requests%ROWTYPE;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_is_admin BOOLEAN := false;
BEGIN
  IF LENGTH(TRIM(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'New password must be at least 6 characters long.';
  END IF;

  -- 1. Fetch and lock the reset request row
  SELECT * INTO v_req
  FROM public.password_reset_requests
  WHERE id = p_reset_id
    AND LOWER(user_email) = v_clean_email
    AND is_used = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired password reset session. Please request a new code.';
  END IF;

  -- 2. Check 2-minute expiration window
  IF NOW() > v_req.expires_at THEN
    DELETE FROM public.password_reset_requests WHERE id = p_reset_id;
    RAISE EXCEPTION 'Recovery OTP has expired (2-minute limit). Please request a new OTP.';
  END IF;

  IF v_req.attempt_count >= 5 THEN
    DELETE FROM public.password_reset_requests WHERE id = p_reset_id;
    RAISE EXCEPTION 'Maximum verification attempts exceeded. Please request a new OTP.';
  END IF;

  -- Increment attempt count
  UPDATE public.password_reset_requests
  SET attempt_count = attempt_count + 1
  WHERE id = p_reset_id;

  -- 3. Verify the 6-digit OTP against its bcrypt hash
  IF v_req.otp_hash = crypt(TRIM(p_otp), v_req.otp_hash) THEN
    
    -- 4. Update the user's encrypted password directly in Supabase auth.users
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_new_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = v_req.user_id;

    -- 5. Destroy the used OTP row immediately
    DELETE FROM public.password_reset_requests WHERE id = p_reset_id;

    -- Check if user is an admin for cross-mail notification
    v_is_admin := (v_clean_email IN (
      'ramoliadk@gmail.com',
      'gujarattimecompany@gmail.com',
      'gujrattimecompany@gmail.com',
      'parthsherathiya181@gmail.com'
    ));

    IF NOT v_is_admin AND to_regclass('public.admin_users') IS NOT NULL THEN
      BEGIN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = $1 OR LOWER(email) = $2)'
          INTO v_is_admin
          USING v_req.user_id, v_clean_email;
      EXCEPTION WHEN OTHERS THEN
        v_is_admin := false;
      END;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'email', v_clean_email,
      'isAdmin', v_is_admin
    );
  ELSE
    RAISE EXCEPTION 'Invalid 6-digit recovery OTP code. Please check your email and try again.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_and_update_password(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
