import { createHash } from 'node:crypto';
import { BlobError, BlobPreconditionFailedError, put } from '@vercel/blob';

const DAY_SECONDS = 86_400;

// The caller supplies the ID and expiry from a verified, server-issued grant.
export async function consume(id, expiresAtEpochSeconds) {
  const remaining = expiresAtEpochSeconds - Math.floor(Date.now() / 1000);
  if (typeof id !== 'string' || !/^(?:code|consent):[A-Za-z0-9_-]{22}$/.test(id) ||
      !Number.isSafeInteger(expiresAtEpochSeconds) || remaining <= 0 || remaining > DAY_SECONDS) {
    throw new Error('Invalid replay marker');
  }

  const digest = createHash('sha256').update(id).digest('hex');
  try {
    // A single create-only write elects one redeemer across all instances.
    await put(`oauth/redeemed/${digest}`, '1', {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      ttlDays: 1,
      abortSignal: AbortSignal.timeout(8_000),
    });
    return true;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError ||
        (error instanceof BlobError && error.message.startsWith('Vercel Blob: This blob already exists,'))) {
      return false;
    }
    throw error;
  }
}
