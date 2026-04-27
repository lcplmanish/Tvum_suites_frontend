create table if not exists public.food_settings (
  id integer primary key check (id = 1),
  breakfast_price numeric not null default 150,
  lunch_price numeric not null default 250,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_settings enable row level security;

create policy "Authenticated can view food settings"
on public.food_settings for select to authenticated
using (true);

create policy "Admin/owner can insert food settings"
on public.food_settings for insert to authenticated
with check (public.is_admin_or_owner(auth.uid()));

create policy "Admin/owner can update food settings"
on public.food_settings for update to authenticated
using (public.is_admin_or_owner(auth.uid()));

create policy "Admin/owner can delete food settings"
on public.food_settings for delete to authenticated
using (public.is_admin_or_owner(auth.uid()));

create trigger update_food_settings_updated_at before update on public.food_settings
for each row execute function public.update_updated_at_column();

insert into public.food_settings (id, breakfast_price, lunch_price)
values (1, 150, 250)
on conflict (id) do nothing;

grant select, insert, update, delete on table public.food_settings to authenticated;