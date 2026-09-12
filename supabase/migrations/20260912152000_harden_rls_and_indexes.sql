drop policy if exists votes_public_select on public.votes;

create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

alter policy profiles_owner_insert on public.profiles
  with check ((select auth.uid()) = id);

alter policy profiles_owner_update on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy cases_owner_select on public.cases
  using ((select auth.uid()) = owner_id);

alter policy cases_owner_insert on public.cases
  with check ((select auth.uid()) = owner_id);

alter policy cases_owner_update on public.cases
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy cases_owner_delete on public.cases
  using ((select auth.uid()) = owner_id);

alter policy votes_authenticated_insert on public.votes
  with check ((select auth.uid()) = voter_id);

alter policy votes_owner_select on public.votes
  using ((select auth.uid()) = voter_id);

alter policy reports_authenticated_insert on public.reports
  with check ((select auth.uid()) = reporter_id);

alter policy reports_owner_select on public.reports
  using ((select auth.uid()) = reporter_id);

alter policy subscriptions_owner_select on public.subscriptions
  using ((select auth.uid()) = user_id);

revoke execute on function public.check_action_rate_limit(uuid, text, integer, integer) from authenticated;
grant execute on function public.check_action_rate_limit(uuid, text, integer, integer) to authenticated;
