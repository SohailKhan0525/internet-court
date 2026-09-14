import { getSupabase } from './supabase';

type InvokeResult<T> = { data: T | null; error: string | null };

/**
 * supabase-js's functions.invoke() throws a generic FunctionsHttpError on any
 * non-2xx response ("Edge Function returned a non-2xx status code") instead of
 * surfacing the JSON { error: "..." } body the function actually sent back.
 * The real message is on error.context, which is the raw Response object.
 * This unwraps it so real error text reaches the user instead of a generic one.
 */
export async function invokeEdgeFunction<T = unknown>(name: string, body: Record<string, unknown>): Promise<InvokeResult<T>> {
  const { data, error } = await getSupabase().functions.invoke(name, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const parsed = await context.clone().json();
        if (typeof parsed?.error === 'string') return { data: null, error: parsed.error };
      } catch {
        // response body wasn't JSON — fall through to the generic message
      }
    }
    return { data: null, error: error.message || 'Something went wrong. Please try again.' };
  }
  return { data: data as T, error: null };
}
