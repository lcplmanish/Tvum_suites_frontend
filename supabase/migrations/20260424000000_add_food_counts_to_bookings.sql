alter table public.bookings
add column if not exists breakfast_count integer not null default 0,
add column if not exists lunch_count integer not null default 0;
