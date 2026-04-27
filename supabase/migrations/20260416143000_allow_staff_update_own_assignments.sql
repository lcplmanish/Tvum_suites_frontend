-- Let staff update progress/status on assignments that belong to them.
-- Keeps existing management policies intact.

DROP POLICY IF EXISTS "Staff can update own assignments" ON public.staff_assignments;
CREATE POLICY "Staff can update own assignments"
  ON public.staff_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      LEFT JOIN public.staff_members sm
        ON lower(sm.name) = lower(p.name)
      WHERE p.user_id = auth.uid()
        AND (
          staff_assignments.staff_member_id = sm.id
          OR lower(staff_assignments.staff_name_snapshot) = lower(p.name)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      LEFT JOIN public.staff_members sm
        ON lower(sm.name) = lower(p.name)
      WHERE p.user_id = auth.uid()
        AND (
          staff_assignments.staff_member_id = sm.id
          OR lower(staff_assignments.staff_name_snapshot) = lower(p.name)
        )
    )
  );
  
   
   