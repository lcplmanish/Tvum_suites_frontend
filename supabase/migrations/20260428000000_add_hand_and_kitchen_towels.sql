-- Add hand towels and kitchen towels columns to laundry_records table
ALTER TABLE public.laundry_records
ADD COLUMN IF NOT EXISTS hand_towels_given INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hand_towels_taken INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS kitchen_towels_given INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS kitchen_towels_taken INT DEFAULT 0;
