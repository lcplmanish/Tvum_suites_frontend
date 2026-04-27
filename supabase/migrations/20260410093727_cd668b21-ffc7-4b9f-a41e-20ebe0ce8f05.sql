
-- Drop the existing unsafe update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with WITH CHECK that prevents role changes
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role IS NOT DISTINCT FROM (
      SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
