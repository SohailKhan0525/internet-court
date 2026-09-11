create or replace function public.current_membership_plan(p_user_id uuid default auth.uid())
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select s.plan_code::text
  from public.subscriptions s
  where s.user_id = p_user_id
    and s.provider = 'paypal'
    and s.status in ('trialing','active')
    and (s.current_period_end is null or s.current_period_end > now())
  order by case s.plan_code when 'supreme_court' then 2 when 'jury_member' then 1 else 0 end desc, s.updated_at desc
  limit 1;
$$;

create or replace function public.has_paid_membership(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.current_membership_plan(p_user_id) is not null;
$$;

create or replace function public.create_case(p_title text, p_argument text, p_visibility case_visibility default 'public')
returns public.cases
language plpgsql
set search_path = public
as $$
declare
  created_case public.cases;
  uid uuid := auth.uid();
  membership text;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
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

grant execute on function public.current_membership_plan(uuid) to authenticated;
grant execute on function public.has_paid_membership(uuid) to authenticated;
grant execute on function public.create_case(text,text,case_visibility) to authenticated;
