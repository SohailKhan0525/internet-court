'use client';

import { useEffect, useRef } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useToast } from './Toast';

type SubscriptionRow = { status: string; plan_code: string };

const STATUS_MESSAGE: Record<string, { message: string; kind: 'success' | 'error' | 'info' }> = {
  active: { message: 'Your membership is active.', kind: 'success' },
  cancelled: { message: 'Your membership was cancelled.', kind: 'info' },
  past_due: { message: 'Your last membership payment failed — check PayPal.', kind: 'error' },
  expired: { message: 'Your membership has expired.', kind: 'info' },
};

// Listens for changes to the signed-in user's own subscription row (RLS
// already scopes this to their user_id) so a cancellation or payment failure
// that happens on PayPal's side — not through a click on this site — still
// reaches them live, without a page refresh.
export default function RealtimeNotices() {
  const { showToast } = useToast();
  const lastStatus = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`subscriptions-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as SubscriptionRow | undefined;
            if (!row?.status || row.status === lastStatus.current) return;
            lastStatus.current = row.status;
            const entry = STATUS_MESSAGE[row.status];
            if (entry) showToast(entry.message, entry.kind);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [showToast]);

  return null;
}
