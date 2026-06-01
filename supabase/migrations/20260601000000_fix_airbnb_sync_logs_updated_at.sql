-- Ensure sync log updates work with the existing trigger
-- The table originally had a BEFORE UPDATE trigger that expects updated_at.

ALTER TABLE public.airbnb_sync_logs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.airbnb_sync_logs
SET updated_at = COALESCE(updated_at, completed_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE public.airbnb_sync_logs
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.airbnb_sync_logs
  ALTER COLUMN updated_at SET NOT NULL;

DROP TRIGGER IF EXISTS update_sync_logs_updated_at ON public.airbnb_sync_logs;

CREATE TRIGGER update_sync_logs_updated_at
BEFORE UPDATE ON public.airbnb_sync_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();