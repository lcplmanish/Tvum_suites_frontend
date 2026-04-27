-- Add tea_coffee_price to food_settings table
alter table public.food_settings
add column if not exists tea_coffee_price numeric not null default 50;

-- Add tea_coffee_count to bookings table
alter table public.bookings
add column if not exists tea_coffee_count integer default 0;

-- Add tea_coffee columns to food_bills table
alter table public.food_bills
add column if not exists tea_coffee_count integer not null default 0;

alter table public.food_bills
add column if not exists tea_coffee_price numeric not null default 0;

alter table public.food_bills
add column if not exists tea_coffee_total numeric not null default 0;
