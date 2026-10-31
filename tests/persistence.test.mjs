import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAFT_KEY,
  VOTES_KEY,
  readDraft,
  readVotes,
  saveValue,
  validateDraft,
} from '../src/persistence.mjs';

const validIds = ['last-slice', 'group-chat', 'aux-cord', 'office-mug'];

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test('a first visit has no votes or draft', () => {
  const storage = memoryStorage();
  assert.deepEqual(readVotes(storage, validIds), {});
  assert.equal(readDraft(storage), null);
});

test('votes survive a write/read cycle using the namespaced key', () => {
  const storage = memoryStorage({ unrelated: 'keep this' });
  const votes = { 'last-slice': 'claimant', 'group-chat': 'respondent' };
  assert.equal(saveValue(storage, VOTES_KEY, votes), true);
  assert.deepEqual(readVotes(storage, validIds), votes);
  assert.equal(storage.getItem('unrelated'), 'keep this');
});

test('stale case IDs and invalid verdict values are discarded', () => {
  const storage = memoryStorage({
    [VOTES_KEY]: JSON.stringify({
      'last-slice': 'claimant',
      'group-chat': 'respondent',
      'retired-case': 'claimant',
      'aux-cord': 'unknown',
      'office-mug': { value: 'claimant' },
    }),
  });
  assert.deepEqual(readVotes(storage, validIds), {
    'last-slice': 'claimant',
    'group-chat': 'respondent',
  });
});

test('malformed JSON and non-record vote payloads do not crash the page', () => {
  for (const value of ['{broken', 'null', '[]', '"claimant"', '23', 'true']) {
    assert.deepEqual(readVotes(memoryStorage({ [VOTES_KEY]: value }), validIds), {}, value);
  }
});

test('storage access failures fall back to empty local state', () => {
  const blockedStorage = { getItem() { throw new Error('Storage denied'); } };
  assert.deepEqual(readVotes(blockedStorage, validIds), {});
  assert.equal(readDraft(blockedStorage), null);
});

test('write failures return false without reporting a successful save', () => {
  const fullStorage = { setItem() { throw new Error('Quota exceeded'); } };
  assert.equal(saveValue(fullStorage, DRAFT_KEY, { title: 'A case', story: 'The story' }), false);
});

test('serialization failure does not overwrite a saved value', () => {
  const storage = memoryStorage({ [DRAFT_KEY]: 'existing draft' });
  const circular = {};
  circular.self = circular;
  assert.equal(saveValue(storage, DRAFT_KEY, circular), false);
  assert.equal(storage.getItem(DRAFT_KEY), 'existing draft');
});

test('valid saved drafts return only their editable fields', () => {
  const storage = memoryStorage({
    [DRAFT_KEY]: JSON.stringify({ title: 'The missing slice', story: 'Both sides of the pizza dispute.', unexpected: 'ignored' }),
  });
  assert.deepEqual(readDraft(storage), {
    title: 'The missing slice', story: 'Both sides of the pizza dispute.',
  });
});

test('malformed or incorrectly typed draft records are ignored', () => {
  const values = ['{broken', 'null', '[]', '42', '{}', '{"title":5,"story":"text"}', '{"title":"text","story":null}'];
  for (const value of values) {
    assert.equal(readDraft(memoryStorage({ [DRAFT_KEY]: value })), null, value);
  }
});

test('oversized saved draft fields are bounded before returning to the form', () => {
  const storage = memoryStorage({ [DRAFT_KEY]: JSON.stringify({ title: 't'.repeat(150), story: 's'.repeat(1500) }) });
  assert.deepEqual(readDraft(storage), { title: 't'.repeat(100), story: 's'.repeat(1200) });
});

test('draft validation accepts both minimum and maximum supported lengths', () => {
  assert.deepEqual(validateDraft('t'.repeat(8), 's'.repeat(30)), {});
  assert.deepEqual(validateDraft('t'.repeat(100), 's'.repeat(1200)), {});
  assert.deepEqual(validateDraft('  A fair case  ', '  ' + 'A story worth hearing from each side.' + '  '), {});
});

test('draft validation reports each invalid field and rejects whitespace padding', () => {
  assert.deepEqual(Object.keys(validateDraft('short', 'too short')).sort(), ['story', 'title']);
  assert.deepEqual(Object.keys(validateDraft(' '.repeat(10), ' '.repeat(50))).sort(), ['story', 'title']);
  assert.deepEqual(Object.keys(validateDraft('t'.repeat(101), 's'.repeat(1201))).sort(), ['story', 'title']);
  assert.deepEqual(Object.keys(validateDraft('An adequate title', 'short')), ['story']);
  assert.deepEqual(Object.keys(validateDraft('short', 's'.repeat(30))), ['title']);
});
