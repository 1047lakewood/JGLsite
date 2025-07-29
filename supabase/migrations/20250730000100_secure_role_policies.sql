/*
  # Resolve RLS recursion with role helper functions
  
  This migration replaces recursive role checks in user_profiles RLS policies
  with SECURITY DEFINER helper functions. The previous policies referenced the
  user_profiles table within policy USING expressions which led to circular
  evaluation and queries hanging during authentication.
  
  Steps:
  - Create helper functions is_admin(uid) and can_view_gymnast(uid, gym_id)
    that check the user's role without being subject to RLS.
  - Replace policies to use these helpers while keeping existing semantics.
*/

-- Helper functions executed with elevated privileges
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role = 'admin' FROM user_profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION can_view_gymnast(uid uuid, gid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role IN ('coach','gym_admin') AND gym_id = gid
  FROM user_profiles WHERE id = uid;
$$;

-- Remove overly permissive policies introduced previously
DROP POLICY IF EXISTS "Public profile read access" ON user_profiles;

-- Recreate role-based view policies using helper functions
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Coaches can view gymnasts in their gym"
  ON user_profiles
  FOR SELECT
  USING (can_view_gymnast(auth.uid(), gym_id));

-- Keep existing self-access and insert policy
-- (Users can manage own profile) and (Allow profile creation) remain
