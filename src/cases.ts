export type Verdict = 'claimant' | 'respondent';
export type CourtCase = {
  id: string; number: string; category: 'Everyday life' | 'Friendships' | 'Work';
  title: string; summary: string; claimant: string; respondent: string;
  evidence: string[]; illustration: 'pizza' | 'chat' | 'music' | 'mug';
  color: string; claimantLabel: string; respondentLabel: string;
};

export const cases: CourtCase[] = [
  {
    id: 'last-slice', number: '001', category: 'Everyday life', title: 'The last slice has a rightful owner. Right?',
    summary: 'One pizza. Two roommates. A note that apparently meant nothing.',
    claimant: 'I paid for the pizza, put the last slice in the fridge, and left a note saying “for tomorrow.” My roommate ate it at 12:01 a.m. That is not what I meant.',
    respondent: 'The note said “for tomorrow.” It was tomorrow. Also, I bought the garlic bread. We never established a household pizza policy.',
    evidence: ['Exhibit A: a note reading “for tomorrow.”', 'Exhibit B: a very precisely timestamped apology.', 'Agreed fact: the garlic bread was shared.'],
    illustration: 'pizza', color: 'peach', claimantLabel: 'The slice was reserved', respondentLabel: 'Tomorrow is tomorrow',
  },
  {
    id: 'group-chat', number: '002', category: 'Friendships', title: 'Is “on my way” a legally binding statement?',
    summary: 'Sent at 7:02. Still looking for shoes at 7:24. The chat has questions.',
    claimant: 'We agreed to meet at seven. They texted “on my way” at 7:02 and arrived at 7:48. We ordered without them and now apparently we are the bad friends.',
    respondent: 'I was on my way emotionally. Choosing shoes is part of the journey. They could have waited eight more minutes for a shared starter.',
    evidence: ['Exhibit A: “on my way” sent at 7:02.', 'Exhibit B: a shoe photo sent at 7:24.', 'Agreed fact: the starter was excellent.'],
    illustration: 'chat', color: 'lavender', claimantLabel: 'Words mean things', respondentLabel: 'Give them some grace',
  },
  {
    id: 'aux-cord', number: '003', category: 'Friendships', title: 'Does the driver get absolute aux authority?',
    summary: 'A three-hour road trip. The same album. On repeat. Again.',
    claimant: 'I drove the entire way, paid for fuel, and made a playlist. My passengers staged an aux-cord coup halfway through track four.',
    respondent: 'The playlist was one album repeated three times. We offered to buy snacks and requested literally any other artist. This was a peaceful intervention.',
    evidence: ['Exhibit A: a playlist with 36 songs, 12 unique.', 'Exhibit B: an unopened bag of peace-offering crisps.', 'Agreed fact: nobody else offered to drive.'],
    illustration: 'music', color: 'sage', claimantLabel: 'Driver makes the rules', respondentLabel: 'The aux is a democracy',
  },
  {
    id: 'office-mug', number: '004', category: 'Work', title: 'A mug in the office is not a communal mug.',
    summary: 'It says “my mug.” The defence argues that is open to interpretation.',
    claimant: 'I brought my favourite mug to work. Someone keeps using it, leaving tea stains, and putting it back on my desk. It literally says “my mug.”',
    respondent: 'It was in the shared kitchen. Every mug is somebody’s mug. I thought “my mug” was a statement anyone holding it could make.',
    evidence: ['Exhibit A: the words “my mug.”', 'Exhibit B: a shared cupboard full of other mugs.', 'Agreed fact: it was not washed afterwards.'],
    illustration: 'mug', color: 'blue', claimantLabel: 'Respect the mug', respondentLabel: 'Kitchen rules apply',
  },
];
