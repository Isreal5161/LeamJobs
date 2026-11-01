import assert from 'node:assert/strict';
import test from 'node:test';
import { sortJobsByNewest } from '../src/utils/jobSorting.ts';

test('welcome jobs are ordered newest first by the backend createdAt timestamp', () => {
  const jobs = [
    { id: 'older', postedAt: Date.parse('2026-09-10T17:47:45.864Z') },
    { id: 'newer', postedAt: Date.parse('2026-09-14T10:37:52.201Z') },
  ];

  assert.deepEqual(sortJobsByNewest(jobs).map(({ id }) => id), ['newer', 'older']);
  assert.deepEqual(jobs.map(({ id }) => id), ['older', 'newer']);
});
