'use strict';
const cases = [
  { title: 'The people vs. the last slice', argument: '“My roommate left one slice of pizza in the fridge for two days. I ate it. They say I owe them a whole pizza. I say leftovers have a statute of limitations.”', other: '“I bought the pizza. I was saving that slice. You could have asked.”', question: 'Does the pizza thief owe a replacement?', yes: 'Yes, pay up', no: 'No, fair game' },
  { title: 'The people vs. watching ahead', argument: '“We were watching a series together. My partner fell asleep halfway through an episode, so I watched two more. I offered to rewatch them. Apparently, that doesn’t count.”', other: '“Watching it together was the whole point. Now you know the plot twist before I do.”', question: 'Is watching ahead a betrayal?', yes: 'Yes, absolutely', no: 'No, just rewatch' },
  { title: 'The people vs. the café camper', argument: '“I bought a coffee, found a table, and worked for four hours. The café had empty seats. A friend says I should have ordered more. I thought the coffee came with a place to sit.”', other: '“A café isn’t a free coworking space. One drink shouldn’t buy you a whole afternoon.”', question: 'Should the café camper order more?', yes: 'Yes, another round', no: 'No, seats were free' }
];
const storageKeys = { votes: 'internet-court-demo-votes-v1', draft: 'internet-court-draft-v1' };
function readStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
const storedVotes = readStorage(storageKeys.votes, {});
const votes = storedVotes && typeof storedVotes === 'object' && !Array.isArray(storedVotes) ? storedVotes : {};
let currentCase = 0;
function renderVote() {
  const choice = votes[currentCase];
  const hasVote = choice === 'yes' || choice === 'no';
  document.querySelector('.vote-buttons').hidden = hasVote;
  document.querySelector('.vote-result').hidden = !hasVote;
  if (hasVote) document.getElementById('vote-result-text').textContent = `You voted “${cases[currentCase][choice]}”. This is your demo vote, not a community verdict.`;
}
function selectCase(index, moveFocus = false) {
  currentCase = index;
  const item = cases[index];
  document.querySelectorAll('[data-case]').forEach((tab, i) => { tab.classList.toggle('active', i === index); tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  document.getElementById('case-panel').setAttribute('aria-labelledby', `case-tab-${index}`);
  document.getElementById('jury-case-number').textContent = `Case no. 00${index + 1}`;
  document.getElementById('jury-title').textContent = item.title;
  document.getElementById('jury-argument').textContent = item.argument;
  document.getElementById('jury-other').textContent = item.other;
  document.getElementById('vote-question').textContent = item.question;
  document.getElementById('yes-label').textContent = item.yes;
  document.getElementById('no-label').textContent = item.no;
  renderVote();
  if (moveFocus) document.getElementById(`case-tab-${index}`).focus();
}
document.querySelectorAll('[data-case]').forEach(tab => {
  tab.addEventListener('click', () => selectCase(Number(tab.dataset.case)));
  tab.addEventListener('keydown', event => {
    const index = Number(tab.dataset.case);
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % cases.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + cases.length - 1) % cases.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cases.length - 1;
    if (next !== undefined) { event.preventDefault(); selectCase(next, true); }
  });
});
document.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
  votes[currentCase] = button.dataset.vote;
  const saved = writeStorage(storageKeys.votes, votes);
  renderVote();
  if (!saved) document.getElementById('vote-result-text').textContent += ' Browser storage is unavailable, so this vote will reset when you leave.';
  document.getElementById('change-vote').focus();
}));
document.getElementById('change-vote').addEventListener('click', () => { delete votes[currentCase]; writeStorage(storageKeys.votes, votes); renderVote(); document.querySelector('[data-vote="yes"]').focus(); });
renderVote();
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
function closeMenu() { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = mobileMenu.hidden; mobileMenu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', event => { if (!mobileMenu.hidden && !event.target.closest('.site-header')) closeMenu(); });
const draftDialog = document.getElementById('draft-dialog');
const privacyDialog = document.getElementById('privacy-dialog');
const draftForm = document.getElementById('draft-form');
const titleInput = document.getElementById('case-title');
const categoryInput = document.getElementById('case-category');
const storyInput = document.getElementById('case-story');
const status = document.getElementById('draft-status');
const deleteDraftButton = document.getElementById('delete-draft');
let draftLoaded = false;
let lastOpener;
function updateCount() { document.getElementById('story-count').textContent = `${storyInput.value.length.toLocaleString('en-US')} / 3,000`; }
function openDraft(button) {
  lastOpener = button;
  if (!draftLoaded) {
    const saved = readStorage(storageKeys.draft, null);
    if (saved && typeof saved.title === 'string' && typeof saved.story === 'string') { titleInput.value = saved.title.slice(0, 100); storyInput.value = saved.story.slice(0, 3000); if ([...categoryInput.options].some(option => option.value === saved.category)) categoryInput.value = saved.category; status.textContent = 'Your saved draft is ready to edit'; deleteDraftButton.hidden = false; }
    draftLoaded = true;
  }
  updateCount(); closeMenu(); draftDialog.showModal();
}
document.querySelectorAll('[data-open-draft]').forEach(button => button.addEventListener('click', () => openDraft(button)));
document.querySelector('[data-open-privacy]').addEventListener('click', event => { lastOpener = event.currentTarget; privacyDialog.showModal(); });
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => { dialog.addEventListener('close', () => lastOpener?.focus()); dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }); });
storyInput.addEventListener('input', updateCount);
function draftData() { return { title: titleInput.value.trim(), category: categoryInput.value, story: storyInput.value.trim() }; }
function validateDraft() { titleInput.setCustomValidity(titleInput.value.trim() ? '' : 'Give your case a title'); storyInput.setCustomValidity(storyInput.value.trim().length >= 20 ? '' : 'Tell your story in at least 20 characters'); return draftForm.reportValidity(); }
titleInput.addEventListener('input', () => titleInput.setCustomValidity(''));
storyInput.addEventListener('input', () => storyInput.setCustomValidity(''));
draftForm.addEventListener('submit', event => { event.preventDefault(); if (!validateDraft()) return; const saved = writeStorage(storageKeys.draft, draftData()); status.textContent = saved ? 'Draft saved on this device. Nothing has been posted publicly.' : 'This browser couldn’t save the draft. Use “Download a copy” to keep it.'; if (saved) deleteDraftButton.hidden = false; });
document.getElementById('download-draft').addEventListener('click', () => {
  if (!validateDraft()) return;
  const draft = draftData();
  const text = `Internet Court — private case draft\n\n${draft.title}\nCategory: ${draft.category}\n\n${draft.story}\n\nThis draft has not been published.\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'internet-court-draft.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Your draft copy is ready in your downloads';
});
deleteDraftButton.addEventListener('click', () => { try { localStorage.removeItem(storageKeys.draft); draftForm.reset(); updateCount(); status.textContent = 'Saved draft deleted from this device'; deleteDraftButton.hidden = true; titleInput.focus(); } catch { status.textContent = 'Browser storage is unavailable. Clear site data in your browser settings to remove the saved draft.'; } });
