-- FxLocus Admin System v1 (Supabase Auth + RBAC + RLS)
-- Safe to run multiple times.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('student', 'leader', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.student_status as enum ('普通学员', '考核通过', '学习中', '捐赠学员');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rejection_reason as enum ('资料不完整', '不符合要求', '名额已满', '重复申请', '其他');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.file_type as enum ('doc', 'docx', 'pdf', 'mp4');
exception when duplicate_object then null; end $$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'leader'
  );
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student'
  );
$$;

create or replace function public.is_team_member(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_id and leader_id = auth.uid()
  );
$$;

create or replace function public.profile_sensitive_unchanged(
  target_id uuid,
  new_role public.user_role,
  new_leader_id uuid,
  new_status public.student_status,
  new_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_id
      and p.role = new_role
      and p.student_status = new_status
      and p.leader_id is not distinct from new_leader_id
      and p.email is not distinct from new_email
  );
$$;

create or replace function public.profile_leader_immutables_unchanged(
  target_id uuid,
  new_role public.user_role,
  new_leader_id uuid,
  new_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_id
      and p.role = new_role
      and p.leader_id is not distinct from new_leader_id
      and p.email is not distinct from new_email
  );
$$;

create or replace function public.profile_account_status_unchanged(
  target_id uuid,
  new_account_status text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_id
      and p.status is not distinct from new_account_status
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role public.user_role not null default 'student',
  leader_id uuid references public.profiles(id) on delete set null,
  student_status public.student_status not null default '普通学员',
  status text not null default 'active',
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists status text,
  add column if not exists last_login_at timestamptz;

update public.profiles set status = 'active' where status is null;
alter table public.profiles alter column status set default 'active';
alter table public.profiles alter column status set not null;

do $$ begin
  alter table public.profiles
    add constraint profiles_leader_only_for_students
    check (role = 'student' or leader_id is null);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_account_status_check
    check (status in ('active', 'frozen'));
exception when duplicate_object then null; end $$;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_leader_idx on public.profiles (leader_id);
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_status_idx on public.profiles (status);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, created_at, updated_at)
  values (new.id, new.email, 'student', now(), now())
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create table if not exists public.role_audit_logs (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  from_role public.user_role not null,
  to_role public.user_role not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_email text not null,
  applicant_name text,
  applicant_phone text,
  leader_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason public.rejection_reason,
  payload jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  from_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  content text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_to_user_idx on public.notifications (to_user_id, read_at, created_at desc);

create table if not exists public.courses (
  id int primary key,
  title_zh text,
  title_en text,
  summary_zh text,
  summary_en text,
  content_bucket text,
  content_path text,
  content_mime_type text,
  content_file_name text,
  published boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id int not null references public.courses(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'completed')),
  rejection_reason public.rejection_reason,
  progress int not null default 0,
  last_video_sec int not null default 0,
  completed_at timestamptz,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.course_access
  add column if not exists completed_at timestamptz;

create unique index if not exists course_access_user_course_uidx on public.course_access (user_id, course_id);
create index if not exists course_access_status_idx on public.course_access (status);
create index if not exists course_access_user_idx on public.course_access (user_id);

create table if not exists public.course_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id int not null references public.courses(id) on delete cascade,
  content_md text,
  updated_at timestamptz not null default now()
);

create unique index if not exists course_notes_user_course_uidx on public.course_notes (user_id, course_id);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  category text,
  name text not null,
  description text,
  storage_bucket text not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  mime_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists files_storage_path_uidx on public.files (storage_bucket, storage_path);
create index if not exists files_created_at_idx on public.files (created_at desc);

alter table public.files
  add column if not exists file_type public.file_type,
  add column if not exists course_id int references public.courses(id) on delete set null,
  add column if not exists lesson_id int,
  add column if not exists thumbnail_bucket text,
  add column if not exists thumbnail_path text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists files_course_id_idx on public.files (course_id);
create index if not exists files_file_type_idx on public.files (file_type);

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'file_permissions' and column_name = 'user_id'
  ) then
    execute 'alter table public.file_permissions rename column user_id to grantee_profile_id';
  end if;
end $$;

create table if not exists public.file_permissions (
  file_id uuid not null references public.files(id) on delete cascade,
  grantee_profile_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (file_id, grantee_profile_id)
);

create index if not exists file_permissions_grantee_idx on public.file_permissions (grantee_profile_id);

create table if not exists public.file_access_requests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  rejection_reason public.rejection_reason,
  primary key (user_id, file_id)
);

create index if not exists file_access_requests_status_idx on public.file_access_requests (status, requested_at desc);

create table if not exists public.file_download_logs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip text,
  user_agent text,
  downloaded_at timestamptz not null default now()
);

create index if not exists file_download_logs_file_idx on public.file_download_logs (file_id, downloaded_at desc);

-- Reporting helpers (used by the admin dashboard/reports API)
create or replace function public.report_student_status_counts(_leader_id uuid default null)
returns table(student_status text, total bigint, frozen bigint)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select role from public.profiles where id = auth.uid()
  ),
  scope as (
    select
      (select role from me) as role,
      case
        when (select role from me) = 'super_admin' then _leader_id
        when (select role from me) = 'leader' then auth.uid()
        else null
      end as leader_id
  )
  select
    p.student_status::text as student_status,
    count(*)::bigint as total,
    count(*) filter (where p.status = 'frozen')::bigint as frozen
  from public.profiles p, scope s
  where p.role = 'student'
    and (
      (s.role = 'super_admin' and (s.leader_id is null or p.leader_id = s.leader_id))
      or (s.role = 'leader' and p.leader_id = s.leader_id)
    )
  group by p.student_status;
$$;

grant execute on function public.report_student_status_counts(uuid) to authenticated;

create or replace function public.report_course_access_status_counts(_leader_id uuid default null)
returns table(status text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select role from public.profiles where id = auth.uid()
  ),
  scope as (
    select
      (select role from me) as role,
      case
        when (select role from me) = 'super_admin' then _leader_id
        when (select role from me) = 'leader' then auth.uid()
        else null
      end as leader_id
  )
  select
    ca.status::text as status,
    count(*)::bigint as total
  from public.course_access ca
  join public.profiles p on p.id = ca.user_id
  join scope s on true
  where p.role = 'student'
    and ca.status in ('requested', 'approved', 'rejected', 'completed')
    and (
      (s.role = 'super_admin' and (s.leader_id is null or p.leader_id = s.leader_id))
      or (s.role = 'leader' and p.leader_id = s.leader_id)
    )
  group by ca.status;
$$;

grant execute on function public.report_course_access_status_counts(uuid) to authenticated;

create or replace function public.report_pending_file_access_requests(_leader_id uuid default null)
returns table(total bigint)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select role from public.profiles where id = auth.uid()
  ),
  scope as (
    select
      (select role from me) as role,
      case
        when (select role from me) = 'super_admin' then _leader_id
        when (select role from me) = 'leader' then auth.uid()
        else null
      end as leader_id
  )
  select
    count(*)::bigint as total
  from public.file_access_requests r
  join public.profiles p on p.id = r.user_id
  join scope s on true
  where r.status = 'requested'
    and p.role = 'student'
    and (
      (s.role = 'super_admin' and (s.leader_id is null or p.leader_id = s.leader_id))
      or (s.role = 'leader' and p.leader_id = s.leader_id)
    );
$$;

grant execute on function public.report_pending_file_access_requests(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.role_audit_logs enable row level security;
alter table public.student_applications enable row level security;
alter table public.notifications enable row level security;
alter table public.courses enable row level security;
alter table public.course_access enable row level security;
alter table public.course_notes enable row level security;
alter table public.files enable row level security;
alter table public.file_permissions enable row level security;
alter table public.file_access_requests enable row level security;
alter table public.file_download_logs enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_super_admin()
    or (public.is_leader() and role = 'student' and leader_id = auth.uid())
  );

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert
  with check (
    auth.uid() = id or public.is_super_admin()
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.profile_sensitive_unchanged(id, role, leader_id, student_status, email)
    and public.profile_account_status_unchanged(id, status)
  );

drop policy if exists "profiles_update_leader_students" on public.profiles;
create policy "profiles_update_leader_students" on public.profiles
  for update
  using (public.is_leader() and role = 'student' and leader_id = auth.uid())
  with check (
    public.is_leader()
    and role = 'student'
    and leader_id = auth.uid()
    and public.profile_leader_immutables_unchanged(id, role, leader_id, email)
  );

drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin" on public.profiles
  for update
  using (public.is_super_admin());

drop policy if exists "profiles_delete_super_admin" on public.profiles;
create policy "profiles_delete_super_admin" on public.profiles
  for delete
  using (public.is_super_admin());

drop policy if exists "role_audit_select" on public.role_audit_logs;
create policy "role_audit_select" on public.role_audit_logs
  for select
  using (public.is_super_admin());

drop policy if exists "role_audit_insert" on public.role_audit_logs;
create policy "role_audit_insert" on public.role_audit_logs
  for insert
  with check (public.is_super_admin());

drop policy if exists "student_applications_insert" on public.student_applications;
create policy "student_applications_insert" on public.student_applications
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "student_applications_select" on public.student_applications;
create policy "student_applications_select" on public.student_applications
  for select
  using (
    public.is_super_admin()
    or (public.is_leader() and leader_id = auth.uid())
  );

drop policy if exists "student_applications_update" on public.student_applications;
create policy "student_applications_update" on public.student_applications
  for update
  using (
    public.is_super_admin()
    or (public.is_leader() and leader_id = auth.uid())
  )
  with check (
    public.is_super_admin()
    or (public.is_leader() and leader_id = auth.uid())
  );

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select
  using (
    public.is_super_admin()
    or to_user_id = auth.uid()
    or from_user_id = auth.uid()
  );

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert
  with check (
    from_user_id = auth.uid()
    and (
      public.is_super_admin()
      or (public.is_leader() and public.is_team_member(to_user_id))
    )
  );

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete
  using (public.is_super_admin());

drop policy if exists "courses_select_public" on public.courses;
create policy "courses_select_public" on public.courses
  for select
  using (
    (deleted_at is null and published = true)
    or public.is_super_admin()
  );

drop policy if exists "courses_write_super_admin" on public.courses;
create policy "courses_write_super_admin" on public.courses
  for insert with check (public.is_super_admin());

drop policy if exists "courses_update_super_admin" on public.courses;
create policy "courses_update_super_admin" on public.courses
  for update using (public.is_super_admin());

drop policy if exists "courses_delete_super_admin" on public.courses;
create policy "courses_delete_super_admin" on public.courses
  for delete using (public.is_super_admin());

drop policy if exists "course_access_select" on public.course_access;
create policy "course_access_select" on public.course_access
  for select
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
  );

drop policy if exists "course_access_insert" on public.course_access;
create policy "course_access_insert" on public.course_access
  for insert
  with check (
    public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
    or (user_id = auth.uid() and status = 'requested')
  );

drop policy if exists "course_access_update_self" on public.course_access;
create policy "course_access_update_self" on public.course_access
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      (
        status = (select c.status from public.course_access c where c.id = course_access.id)
        and rejection_reason is not distinct from (select c.rejection_reason from public.course_access c where c.id = course_access.id)
        and reviewed_by is not distinct from (select c.reviewed_by from public.course_access c where c.id = course_access.id)
        and reviewed_at is not distinct from (select c.reviewed_at from public.course_access c where c.id = course_access.id)
        and completed_at is not distinct from (select c.completed_at from public.course_access c where c.id = course_access.id)
      )
      or (
        (select c.status from public.course_access c where c.id = course_access.id) = 'rejected'
        and status = 'requested'
        and rejection_reason is null
        and reviewed_by is null
        and reviewed_at is null
        and completed_at is null
      )
      or (
        (select c.status from public.course_access c where c.id = course_access.id) = 'approved'
        and status = 'completed'
        and progress = 100
        and rejection_reason is not distinct from (select c.rejection_reason from public.course_access c where c.id = course_access.id)
        and reviewed_by is not distinct from (select c.reviewed_by from public.course_access c where c.id = course_access.id)
        and reviewed_at is not distinct from (select c.reviewed_at from public.course_access c where c.id = course_access.id)
      )
    )
  );

drop policy if exists "course_access_update_admin" on public.course_access;
create policy "course_access_update_admin" on public.course_access
  for update
  using (
    public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
  );

drop policy if exists "course_access_delete_admin" on public.course_access;
create policy "course_access_delete_admin" on public.course_access
  for delete
  using (public.is_super_admin());

drop policy if exists "course_notes_select" on public.course_notes;
create policy "course_notes_select" on public.course_notes
  for select
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "course_notes_write" on public.course_notes;
create policy "course_notes_write" on public.course_notes
  for insert
  with check (user_id = auth.uid());

drop policy if exists "course_notes_update" on public.course_notes;
create policy "course_notes_update" on public.course_notes
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "files_select" on public.files;
create policy "files_select" on public.files
  for select
  using (auth.uid() is not null);

drop policy if exists "files_write_super_admin" on public.files;
create policy "files_write_super_admin" on public.files
  for insert
  with check (public.is_super_admin());

drop policy if exists "files_update_super_admin" on public.files;
create policy "files_update_super_admin" on public.files
  for update
  using (public.is_super_admin());

drop policy if exists "files_delete_super_admin" on public.files;
create policy "files_delete_super_admin" on public.files
  for delete
  using (public.is_super_admin());

drop policy if exists "file_permissions_select" on public.file_permissions;
create policy "file_permissions_select" on public.file_permissions
  for select
  using (
    public.is_super_admin()
    or grantee_profile_id = auth.uid()
    or (public.is_leader() and public.is_team_member(grantee_profile_id))
  );

drop policy if exists "file_permissions_insert" on public.file_permissions;
create policy "file_permissions_insert" on public.file_permissions
  for insert
  with check (
    granted_by = auth.uid()
    and (
      public.is_super_admin()
      or (public.is_leader() and public.is_team_member(grantee_profile_id))
    )
  );

drop policy if exists "file_permissions_delete" on public.file_permissions;
create policy "file_permissions_delete" on public.file_permissions
  for delete
  using (public.is_super_admin());

drop policy if exists "file_access_requests_select" on public.file_access_requests;
create policy "file_access_requests_select" on public.file_access_requests
  for select
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
  );

drop policy if exists "file_access_requests_insert" on public.file_access_requests;
create policy "file_access_requests_insert" on public.file_access_requests
  for insert
  with check (user_id = auth.uid());

drop policy if exists "file_access_requests_update" on public.file_access_requests;
create policy "file_access_requests_update" on public.file_access_requests
  for update
  using (
    public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
  )
  with check (
    public.is_super_admin()
    or (public.is_leader() and public.is_team_member(user_id))
  );

drop policy if exists "file_access_requests_update_self" on public.file_access_requests;
create policy "file_access_requests_update_self" on public.file_access_requests
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (select r.status from public.file_access_requests r where r.user_id = file_access_requests.user_id and r.file_id = file_access_requests.file_id) = 'rejected'
    and status = 'requested'
    and reviewed_by is null
    and reviewed_at is null
    and rejection_reason is null
  );

drop policy if exists "file_download_logs_insert" on public.file_download_logs;
create policy "file_download_logs_insert" on public.file_download_logs
  for insert
  with check (user_id = auth.uid());

drop policy if exists "file_download_logs_select" on public.file_download_logs;
create policy "file_download_logs_select" on public.file_download_logs
  for select
  using (public.is_super_admin());

alter table public.records enable row level security;

drop policy if exists "records select super_admin" on public.records;
create policy "records select super_admin" on public.records
  for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "records update super_admin" on public.records;
create policy "records update super_admin" on public.records
  for update
  to authenticated
  using (public.is_super_admin());

drop policy if exists "records delete super_admin" on public.records;
create policy "records delete super_admin" on public.records
  for delete
  to authenticated
  using (public.is_super_admin());

alter table storage.objects enable row level security;

drop policy if exists "storage_files_read" on storage.objects;
create policy "storage_files_read" on storage.objects
  for select
  using (
    bucket_id in ('fxlocus-files', 'fxlocus_files')
    and (
      public.is_super_admin()
      or auth.uid()::text = split_part(name, '/', 1)
      or exists (
        select 1
        from public.files f
        join public.file_permissions p
          on p.file_id = f.id
        where f.storage_bucket = bucket_id
          and f.storage_path = name
          and (
            p.grantee_profile_id = auth.uid()
            or (public.is_leader() and public.is_team_member(p.grantee_profile_id))
          )
      )
    )
  );

drop policy if exists "storage_files_insert" on storage.objects;
create policy "storage_files_insert" on storage.objects
  for insert
  with check (
    bucket_id in ('fxlocus-files', 'fxlocus_files')
    and (
      public.is_super_admin()
      or (
        auth.uid()::text = split_part(name, '/', 1)
        and lower(coalesce(metadata->>'mimetype', '')) in (
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/mp4'
        )
      )
    )
  );

drop policy if exists "storage_files_update" on storage.objects;
create policy "storage_files_update" on storage.objects
  for update
  using (public.is_super_admin());

drop policy if exists "storage_files_delete" on storage.objects;
create policy "storage_files_delete" on storage.objects
  for delete
  using (public.is_super_admin());

drop policy if exists "storage_ladder_read" on storage.objects;
create policy "storage_ladder_read" on storage.objects
  for select
  using (bucket_id in ('fxlocus-ladder', 'fxlocus_ladder') and public.is_super_admin());

drop policy if exists "storage_ladder_insert" on storage.objects;
create policy "storage_ladder_insert" on storage.objects
  for insert
  with check (bucket_id in ('fxlocus-ladder', 'fxlocus_ladder') and public.is_super_admin());

drop policy if exists "storage_ladder_update" on storage.objects;
create policy "storage_ladder_update" on storage.objects
  for update
  using (bucket_id in ('fxlocus-ladder', 'fxlocus_ladder') and public.is_super_admin());

drop policy if exists "storage_ladder_delete" on storage.objects;
create policy "storage_ladder_delete" on storage.objects
  for delete
  using (bucket_id in ('fxlocus-ladder', 'fxlocus_ladder') and public.is_super_admin());
