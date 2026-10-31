export const VOTES_KEY = 'internet-court:demo:votes:v2';
export const DRAFT_KEY = 'internet-court:demo:draft:v2';

export function readVotes(storage, validIds) {
  try {
    const value = JSON.parse(storage.getItem(VOTES_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id, verdict]) => validIds.includes(id) && (verdict === 'claimant' || verdict === 'respondent')));
  } catch { return {}; }
}

export function saveValue(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function readDraft(storage) {
  try {
    const value = JSON.parse(storage.getItem(DRAFT_KEY) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (typeof value.title !== 'string' || typeof value.story !== 'string') return null;
    return { title: value.title.slice(0, 100), story: value.story.slice(0, 1200) };
  } catch { return null; }
}

export function validateDraft(title, story) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (title.trim().length < 8) errors.title = 'Give your case a title of at least 8 characters.';
  if (title.length > 100) errors.title = 'Keep the title to 100 characters or fewer.';
  if (story.trim().length < 30) errors.story = 'Add at least 30 characters so both sides have some context.';
  if (story.length > 1200) errors.story = 'Keep your case to 1,200 characters or fewer.';
  return errors;
}
