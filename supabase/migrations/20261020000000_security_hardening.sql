-- ═══════════════════════════════════════════════════════════════
-- GUJARAT TIME COMPANY (GTC) · DATABASE SECURITY HARDENING
-- Est. 2026 Haute Horlogerie Atelier
-- Rule 5: Least Privilege, Row Level Security (RLS) & Anti-Tamper
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable RLS on all reservation and customer tables
ALTER TABLE IF EXISTS public.reservations_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_vault_quorum ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy insecure or wildcard policies
DROP POLICY IF EXISTS "Public can view reservations" ON public.reservations_orders;
DROP POLICY IF EXISTS "Allow anon read reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anon insert reservations_orders" ON public.reservations_orders;
DROP POLICY IF EXISTS "Allow anon insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations_orders;
DROP POLICY IF EXISTS "Admins can view all reservations_raw" ON public.reservations;

-- 3. Reservations Orders Policies
-- A. Any anonymous or authenticated collector can submit an allocation (INSERT only)
CREATE POLICY "Allow anon insert reservations_orders"
ON public.reservations_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- B. Only authenticated Admins (or the specific customer) can read reservation orders
CREATE POLICY "Admins can view all reservations"
ON public.reservations_orders
FOR SELECT
TO authenticated
USING (
  -- User is listed in admin_users or has an authorized co-owner email
  EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  )
  OR (auth.jwt() ->> 'email') IN (
    'gujarattimecompany@gmail.com',
    'parthsherathiya181@gmail.com',
    'ramoliadk@gmail.com'
  )
  -- Or user is viewing their own orders
  OR (user_id IS NOT NULL AND user_id = auth.uid())
);

-- 4. Reservations Legacy Table Policies
CREATE POLICY "Allow anon insert reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all reservations_raw"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  )
  OR (auth.jwt() ->> 'email') IN (
    'gujarattimecompany@gmail.com',
    'parthsherathiya181@gmail.com',
    'ramoliadk@gmail.com'
  )
);

-- 5. Customer Profiles Policies
-- Users can only read and edit their own customer profile
CREATE POLICY "Users can view own profile"
ON public.customer_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.customer_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. Admin Users Table (Protected from Public Access)
CREATE POLICY "Only admins can view admin table"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  )
  OR (auth.jwt() ->> 'email') IN (
    'gujarattimecompany@gmail.com',
    'parthsherathiya181@gmail.com',
    'ramoliadk@gmail.com'
  )
);

-- 7. Revoke dangerous default execution permissions
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
