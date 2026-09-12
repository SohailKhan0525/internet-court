revoke execute on function public.check_action_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;

create or replace function public.create_case(p_title text, p_argument text, p_visibility case_visibility default 'public'::case_visibility)
returns public.cases
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
  created_case public.cases;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform public.check_action_rate_limit(uid, 'create_case', 10, 3600);
  if length(trim(p_title)) < 5 or length(trim(p_title)) > 160 then
    raise exception 'Title must be between 5 and 160 characters' using errcode = '22023';
  end if;
  if length(trim(p_argument)) < 20 or length(trim(p_argument)) > 5000 then
    raise exception 'Argument must be between 20 and 5000 characters' using errcode = '22023';
  end if;
  insert into public.cases(owner_id, title, argument, visibility)
  values (uid, trim(p_title), trim(p_argument), p_visibility)
  returning * into created_case;
  return created_case;
end;
$$;

create or replace function public.cast_vote(p_case_id uuid, p_choice boolean)
returns public.cases
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
  v_case public.cases;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  perform public.check_action_rate_limit(uid, 'cast_vote', 60, 3600);
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
