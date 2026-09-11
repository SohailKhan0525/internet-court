create table if not exists public.paypal_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

alter table public.paypal_webhook_events enable row level security;
revoke all on table public.paypal_webhook_events from anon, authenticated;
create index if not exists paypal_webhook_events_received_at_idx on public.paypal_webhook_events (received_at desc);
comment on table public.paypal_webhook_events is 'Idempotency and audit ledger for verified PayPal webhook deliveries.';
