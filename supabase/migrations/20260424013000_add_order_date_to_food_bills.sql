alter table public.food_bills
add column if not exists order_date date not null default current_date;
