-- Fix bookings INSERT policy: require created_by = auth.uid()
DROP POLICY IF EXISTS "Authenticated can create bookings" ON public.bookings;
CREATE POLICY "Authenticated can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Fix room_tasks UPDATE policy: require authenticated user
DROP POLICY IF EXISTS "Authenticated can update room_tasks" ON public.room_tasks;
CREATE POLICY "Authenticated can update room_tasks"
ON public.room_tasks
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);