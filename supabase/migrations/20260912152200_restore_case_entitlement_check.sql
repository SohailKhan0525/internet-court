create or replace function public.create_case(p_title text, p_argument text, p_visibility case_visibility default 'public'::case_visibility)
returns public.cases
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
  created_case public.cases;
  uid uuid := auth.uid();
  membership text;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform private.check_action_rate_limit(uid, 'create_case', 10, 3600);
  if length(trim(p_title)) < 5 or length(trim(p_title)) > 160 then
    raise exception 'Title must be between 5 and 160 characters' using errcode = '22023';
  end if;
  if length(trim(p_argument)) < 20 or length(trim(p_argument)) > 5000 then
    raise exception 'Argument must be between 20 and 5000 characters' using errcode = '22023';
  end if;
  if p_visibility in ('private','unlisted') then
    membership := public.current_membership_plan(uid);
    if membership is null then
      raise exception 'A paid membership is required for private or unlisted cases' using errcode = '42501';
    end if;
  end if;
  insert into public.cases(owner_id, title, argument, visibility)
  values (uid, trim(p_title), trim(p_argument), p_visibility)
  returning * into created_case;
  return created_case;
end;
$$;

grant execute on function public.create_case(text, text, case_visibility) to authenticated;
