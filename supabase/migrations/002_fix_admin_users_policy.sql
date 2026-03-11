-- Fix admin_users policy: allow any authenticated user to check if THEY are an admin
-- (The old policy was circular and could block the check)

DROP POLICY IF EXISTS "Admin read admin_users" ON admin_users;

CREATE POLICY "Users can read own admin status" ON admin_users FOR SELECT
  USING (auth.uid() = id);
