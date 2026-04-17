
-- 1. Security definer functions for role checks (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  )
$$;

-- 2. Fix profiles RLS policies (remove recursive ones)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate non-recursive policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "Owners can insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- 3. Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/owner can insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can update rooms" ON public.rooms FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can delete rooms" ON public.rooms FOR DELETE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed rooms
INSERT INTO public.rooms (number, name, price, image_url) VALUES
(1, 'Studio Suite 1', 120, ''),
(2, 'Studio Suite 2', 130, ''),
(3, 'Studio Suite 3', 125, ''),
(4, 'Studio Suite 4', 135, '')
ON CONFLICT (number) DO NOTHING;

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  infants INTEGER NOT NULL DEFAULT 0,
  pets INTEGER NOT NULL DEFAULT 0,
  guests JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/owner can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pantry',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/owner can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can delete inventory" ON public.inventory FOR DELETE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inventory
INSERT INTO public.inventory (name, category, quantity, min_stock) VALUES
('Tea Bags', 'pantry', 50, 10),
('Coffee', 'pantry', 30, 8),
('Sugar', 'pantry', 20, 5),
('Milk', 'pantry', 15, 5),
('Plates', 'cutlery', 16, 8),
('Spoons', 'cutlery', 20, 8),
('Bowls', 'cutlery', 12, 4),
('Cups', 'cutlery', 16, 8);

-- 6. Staff members table
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  contact TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view staff" ON public.staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/owner can insert staff" ON public.staff_members FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can update staff" ON public.staff_members FOR UPDATE TO authenticated USING (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can delete staff" ON public.staff_members FOR DELETE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed staff
INSERT INTO public.staff_members (name, role, contact) VALUES
('Maria Santos', 'Housekeeper', '+1 555-0101'),
('James Wilson', 'Maintenance', '+1 555-0102'),
('Priya Sharma', 'Front Desk', '+1 555-0103');

-- 7. Room tasks table
CREATE TABLE IF NOT EXISTS public.room_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL UNIQUE,
  room_cleaned BOOLEAN NOT NULL DEFAULT false,
  tea_bags_refilled BOOLEAN NOT NULL DEFAULT false,
  coffee_refilled BOOLEAN NOT NULL DEFAULT false,
  bathroom_cleaned BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view room_tasks" ON public.room_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update room_tasks" ON public.room_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin/owner can insert room_tasks" ON public.room_tasks FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admin/owner can delete room_tasks" ON public.room_tasks FOR DELETE TO authenticated USING (public.is_admin_or_owner(auth.uid()));

CREATE TRIGGER update_room_tasks_updated_at BEFORE UPDATE ON public.room_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed room tasks
INSERT INTO public.room_tasks (room_number) VALUES (1), (2), (3), (4)
ON CONFLICT (room_number) DO NOTHING;
