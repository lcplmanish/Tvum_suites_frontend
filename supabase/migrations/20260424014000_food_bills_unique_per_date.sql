alter table public.food_bills
drop constraint if exists food_bills_booking_id_key;

create unique index if not exists food_bills_booking_id_order_date_key
on public.food_bills (booking_id, order_date);
