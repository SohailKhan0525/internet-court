export const caseDescription = (title: string, votes: number) =>
  `${title} is on trial at Internet Court. Cast your vote and see the real jury verdict. ${votes} ${votes === 1 ? 'vote' : 'votes'} so far.`;
