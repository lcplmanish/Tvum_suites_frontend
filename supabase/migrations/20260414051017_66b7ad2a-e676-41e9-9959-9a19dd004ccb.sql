
-- Create helper function: is_management_or_above (management, admin, owner)
CREATE OR REPLACE FUNCTION public.is_management_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('management', 'admin', 'owner')
  )
$$;

-- Update inventory policies to allow management role to modify
DROP POLICY IF EXISTS "Admin/owner can insert inventory" ON public.inventory;
CREATE POLICY "Management and above can insert inventory"
ON public.inventory FOR INSERT TO authenticated
WITH CHECK (is_management_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admin/owner can update inventory" ON public.inventory;
CREATE POLICY "Management and above can update inventory"
ON public.inventory FOR UPDATE TO authenticated
USING (is_management_or_above(auth.uid()));

DROP POLICY IF EXISTS "Admin/owner can delete inventory" ON public.inventory;
CREATE POLICY "Management and above can delete inventory"
ON public.inventory FOR DELETE TO authenticated
USING (is_admin_or_owner(auth.uid()));
