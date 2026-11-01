import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const verifyEmailPage = readSource('../src/pages/public/VerifyEmailPage.tsx');
const api = readSource('../src/services/api.ts');
const authContext = readSource('../src/context/AuthContext.tsx');

test('Google callback continuation reaches the existing completion API', () => {
  assert.match(verifyEmailPage, /searchParams\.get\('pendingId'\)/);
  assert.match(verifyEmailPage, /searchParams\.get\('continuationToken'\)/);
  assert.match(verifyEmailPage, /await completeGoogleRegistration\(\{/);
  assert.match(api, /endpoint: '\/auth\/google\/complete'/);
  assert.match(api, /body: completion/);
  assert.match(verifyEmailPage, /pendingId: googlePendingId/);
  assert.match(verifyEmailPage, /continuationToken: googleContinuationToken/);
});

test('Google email verification precedes completion and permits completion retry', () => {
  assert.match(verifyEmailPage, /if \(googleVerificationRequired && !googleEmailVerified\)/);
  assert.match(verifyEmailPage, /await verifyEmailCode\(email, code\)/);
  assert.match(verifyEmailPage, /setGoogleEmailVerified\(true\)/);
  assert.match(verifyEmailPage, /await finishGoogleRegistration\(accountRole === 'employer'\)/);
});

test('completed Google session is stored in the shared auth context and routed by role', () => {
  assert.match(verifyEmailPage, /setAuthenticatedSession\(completion\.data\.token/);
  assert.match(authContext, /writeStoredToken\(nextToken\)/);
  assert.match(verifyEmailPage, /user\.role === 'EMPLOYER' \? '\/employer\/jobs' : '\/seeker\/dashboard'/);
});
