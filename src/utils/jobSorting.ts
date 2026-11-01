export const sortJobsByNewest = <T extends { postedAt: number }>(jobs: T[]): T[] =>
  [...jobs].sort((left, right) => right.postedAt - left.postedAt);
