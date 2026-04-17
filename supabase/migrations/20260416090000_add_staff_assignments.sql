CREATE TABLE IF NOT EXISTS public.staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  staff_name_snapshot TEXT NOT NULL,
  work_type TEXT NOT NULL,
  room_number INTEGER,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in-progress', 'completed')),
  due_date DATE,
  notes TEXT,
  assigned_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_member_id
  ON public.staff_assignments(staff_member_id);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_room_number
  ON public.staff_assignments(room_number);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_created_at
  ON public.staff_assignments(created_at DESC);

ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read staff assignments" ON public.staff_assignments;
CREATE POLICY "Authenticated can read staff assignments"
  ON public.staff_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Management can insert staff assignments" ON public.staff_assignments;
CREATE POLICY "Management can insert staff assignments"
  ON public.staff_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_management_or_above(auth.uid()));

DROP POLICY IF EXISTS "Management can update staff assignments" ON public.staff_assignments;
CREATE POLICY "Management can update staff assignments"
  ON public.staff_assignments
  FOR UPDATE
  TO authenticated
  USING (is_management_or_above(auth.uid()));

DROP POLICY IF EXISTS "Management can delete staff assignments" ON public.staff_assignments;
CREATE POLICY "Management can delete staff assignments"
  ON public.staff_assignments
  FOR DELETE
  TO authenticated
  USING (is_management_or_above(auth.uid()));
