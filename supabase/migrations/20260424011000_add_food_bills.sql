create table if not exists public.food_bills (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  room_number integer not null,
  guest_name text not null,
  breakfast_count integer not null default 0,
  lunch_count integer not null default 0,
  breakfast_price numeric not null default 0,
  lunch_price numeric not null default 0,
  breakfast_total numeric not null default 0,
  lunch_total numeric not null default 0,
  total_amount numeric not null default 0,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_bills enable row level security;

create policy "Authenticated can view food bills"
on public.food_bills for select to authenticated
using (true);

create policy "Authenticated can insert food bills"
on public.food_bills for insert to authenticated
with check (true);

create policy "Authenticated can update food bills"
on public.food_bills for update to authenticated
using (true);

create policy "Admin/owner can delete food bills"
on public.food_bills for delete to authenticated
using (public.is_admin_or_owner(auth.uid()));

create trigger update_food_bills_updated_at before update on public.food_bills
for each row execute function public.update_updated_at_column();

grant select, insert, update, delete on table public.food_bills to authenticated;