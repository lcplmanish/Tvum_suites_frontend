insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do nothing;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'storage'
			and tablename = 'objects'
			and policyname = 'Public can view room images'
	) then
		create policy "Public can view room images"
		on storage.objects
		for select
		to public
		using (bucket_id = 'room-images');
	end if;
end
$$;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'storage'
			and tablename = 'objects'
			and policyname = 'Authenticated can upload room images'
	) then
		create policy "Authenticated can upload room images"
		on storage.objects
		for insert
		to authenticated
		with check (bucket_id = 'room-images');
	end if;
end
$$;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'storage'
			and tablename = 'objects'
			and policyname = 'Authenticated can update room images'
	) then
		create policy "Authenticated can update room images"
		on storage.objects
		for update
		to authenticated
		using (bucket_id = 'room-images');
	end if;
end
$$;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'storage'
			and tablename = 'objects'
			and policyname = 'Authenticated can delete room images'
	) then
		create policy "Authenticated can delete room images"
		on storage.objects
		for delete
		to authenticated
		using (bucket_id = 'room-images');
	end if;
end
$$;
