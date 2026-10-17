import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const employerApplicantsPage = await readFile(
  new URL('../src/pages/employer/EmployerApplicantsPage.tsx', import.meta.url),
  'utf8',
);

test('employer applicant list and detail do not reveal seeker subscription tiers', () => {
  assert.doesNotMatch(employerApplicantsPage, /applicant\.subscriptionTier/);
  assert.doesNotMatch(employerApplicantsPage, /applicant\.featured/);
  assert.doesNotMatch(employerApplicantsPage, /<span>Subscription<\/span>/);
  assert.doesNotMatch(employerApplicantsPage, /Premium · Featured · Visibility Boost/);
});

test('employer applicant details continue to show application and profile information', () => {
  assert.match(employerApplicantsPage, /<h2>\{applicant\.fullName\}<\/h2>/);
  assert.match(employerApplicantsPage, /<h2>About the applicant<\/h2>/);
  assert.match(employerApplicantsPage, /renderBadgeList\(applicant\.skills\)/);
  assert.match(employerApplicantsPage, /selectedApplication\.job\.title/);
  assert.match(employerApplicantsPage, /Application status/);
});
