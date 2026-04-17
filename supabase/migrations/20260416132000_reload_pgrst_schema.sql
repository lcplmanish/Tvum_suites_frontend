-- Refresh PostgREST schema cache so newly created tables become visible immediately.
NOTIFY pgrst, 'reload schema';
