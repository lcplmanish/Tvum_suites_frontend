ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_source TEXT NOT NULL DEFAULT 'Airbnb';
