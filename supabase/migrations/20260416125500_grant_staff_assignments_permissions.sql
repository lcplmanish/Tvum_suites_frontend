-- Ensure PostgREST can expose this table to app roles.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.staff_assignments
TO authenticated;

-- Optional read for unauthenticated contexts (safe if RLS blocks rows).
GRANT SELECT
ON TABLE public.staff_assignments
TO anon;
