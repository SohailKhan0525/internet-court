create or replace function private.check_action_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_user_id is null or p_action is null or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.action_rate_limits(user_id, action, window_started_at, request_count)
  values (p_user_id, p_action, v_window, 1)
  on conflict (user_id, action, window_started_at)
  do update set request_count = private.action_rate_limits.request_count + 1
  returning request_count into v_count;
  if v_count > p_limit then
    raise exception 'Too many requests. Please try again later.' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.check_action_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function private.check_action_rate_limit(uuid, text, integer, integer) to authenticated;

drop function if exists public.check_action_rate_limit(uuid, text, integer, integer);

create or replace function public.create_case(p_title text, p_argument text, p_visibility case_visibility default 'public'::case_visibility)
returns public.cases
language plpgsql
security invoker
set search_path = 'public, private'
as $$
declare
  created_case public.cases;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform private.check_action_rate_limit(uid, 'create_case', 10, 3600);
  if length(trim(p_title)) < 5 or length(trim(p_title)) > 160 then raise exception 'Title must be between 5 and 160 characters' using errcode = '22023'; end if;
  if length(trim(p_argument)) < 20 or length(trim(p_argument)) > 5000 then raise exception 'Argument must be between 20 and 5000 characters' using errcode = '22023'; end if;
  insert into public.cases(owner_id, title, argument, visibility) values (uid, trim(p_title), trim(p_argument), p_visibility) returning * into created_case;
  return created_case;
end;
$$;

create or replace function public.cast_vote(p_case_id uuid, p_choice boolean)
returns public.cases
language plpgsql
security invoker
set search_path = 'public, private'
as $$
declare
  v_case public.cases;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  perform private.check_action_rate_limit(uid, 'cast_vote', 60, 3600);
  select * into v_case from public.cases where id = p_case_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Case not found'; end if;
  if v_case.status <> 'open' or v_case.visibility = 'private' then raise exception using errcode = '42501', message = 'Case is not open for voting'; end if;
  insert into public.votes(case_id, voter_id, choice) values (p_case_id, uid, p_choice);
  if p_choice then update public.cases set for_votes = for_votes + 1 where id = p_case_id returning * into v_case;
  else update public.cases set against_votes = against_votes + 1 where id = p_case_id returning * into v_case; end if;
  return v_case;
exception when unique_violation then raise exception using errcode = '23505', message = 'You have already voted on this case';
end;
$$;

revoke execute on function public.create_case(text, text, case_visibility) from public, anon;
grant execute on function public.create_case(text, text, case_visibility) to authenticated;
revoke execute on function public.cast_vote(uuid, boolean) from public, anon;
grant execute on function public.cast_vote(uuid, boolean) to authenticated;
