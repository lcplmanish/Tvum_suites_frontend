-- Create laundry_records table for tracking laundry given/taken and bedding counts
DROP TABLE IF EXISTS public.laundry_records;

CREATE TABLE public.laundry_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_given DATE NOT NULL,
  date_taken DATE,
  bedsheets_given INT NOT NULL DEFAULT 0,
  bedsheets_taken INT DEFAULT 0,
  pillow_covers_given INT NOT NULL DEFAULT 0,
  pillow_covers_taken INT DEFAULT 0,
  towels_given INT NOT NULL DEFAULT 0,
  towels_taken INT DEFAULT 0,
  blankets_given INT NOT NULL DEFAULT 0,
  blankets_taken INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.laundry_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view laundry records" ON public.laundry_records;
DROP POLICY IF EXISTS "Authenticated users can insert laundry records" ON public.laundry_records;
DROP POLICY IF EXISTS "Authenticated users can update laundry records" ON public.laundry_records;
DROP POLICY IF EXISTS "Authenticated users can delete laundry records" ON public.laundry_records;

CREATE POLICY "Authenticated users can view laundry records"
ON public.laundry_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert laundry records"
ON public.laundry_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update laundry records"
ON public.laundry_records FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete laundry records"
ON public.laundry_records FOR DELETE
TO authenticated
USING (true);

DROP FUNCTION IF EXISTS public.update_laundry_records_updated_at();

CREATE OR REPLACE FUNCTION public.update_laundry_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_laundry_records_updated_at ON public.laundry_records;

CREATE TRIGGER update_laundry_records_updated_at
  BEFORE UPDATE ON public.laundry_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_laundry_records_updated_at();
