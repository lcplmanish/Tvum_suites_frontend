-- Allow all authenticated users to insert staff
DROP POLICY IF EXISTS "Admin/owner can insert staff" ON public.staff_members;
CREATE POLICY "Authenticated can insert staff"
ON public.staff_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow all authenticated users to update staff
DROP POLICY IF EXISTS "Admin/owner can update staff" ON public.staff_members;
CREATE POLICY "Authenticated can update staff"
ON public.staff_members FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow management+ to update bookings (currently only admin/owner)
DROP POLICY IF EXISTS "Admin/owner can update bookings" ON public.bookings;
CREATE POLICY "Management and above can update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (is_management_or_above(auth.uid()));