-- Add Airbnb sync tracking columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS airbnb_reservation_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS airbnb_listing_id TEXT,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending', -- pending, synced, failed
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_airbnb_reservation_id ON public.bookings(airbnb_reservation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sync_status ON public.bookings(sync_status);

-- Create sync logs table for tracking
CREATE TABLE IF NOT EXISTS public.airbnb_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'pull' or 'push'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  synced_bookings_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.airbnb_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sync logs" ON public.airbnb_sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create sync logs" ON public.airbnb_sync_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/owner can update sync logs" ON public.airbnb_sync_logs FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_sync_logs_updated_at BEFORE UPDATE ON public.airbnb_sync_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
