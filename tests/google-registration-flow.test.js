import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const verifyEmailPage = readSource('../src/pages/public/VerifyEmailPage.tsx');
const signUpPage = readSource('../src/pages/public/SignUpPage.tsx');
const api = readSource('../src/services/api.ts');
const authContext = readSource('../src/context/AuthContext.tsx');

test('Google callback continuation reaches the existing completion API', () => {
  assert.match(verifyEmailPage, /searchParams\.get\('pendingId'\)/);
  assert.match(verifyEmailPage, /await completeGoogleRegistration\(\{/);
  assert.match(api, /endpoint: '\/auth\/google\/complete'/);
  assert.match(api, /body: completion/);
  assert.match(verifyEmailPage, /pendingId: googlePendingId/);
  assert.doesNotMatch(verifyEmailPage, /continuationToken/);
  assert.doesNotMatch(api, /continuationToken: string/);
  assert.match(api, /credentials: 'include'/);
});

test('Google email verification is bound to the pending OAuth continuation', () => {
  assert.match(verifyEmailPage, /getGoogleRegistrationStatus\(googlePendingId\)/);
  assert.match(verifyEmailPage, /if \(googleVerificationRequired && !googleEmailVerified\)/);
  assert.match(verifyEmailPage, /await verifyGoogleEmailCode\(email, code, googlePendingId\)/);
  assert.match(api, /endpoint: '\/auth\/google\/complete\/verify-email'/);
  assert.match(verifyEmailPage, /await finishGoogleRegistration\(\)/);
});

test('completed Google session is stored in the shared auth context and routed by role', () => {
  assert.match(verifyEmailPage, /setAuthenticatedSession\(completion\.data\.token/);
  assert.match(authContext, /writeStoredToken\(nextToken\)/);
  assert.match(verifyEmailPage, /user\.role === 'EMPLOYER' \? '\/employer\/jobs' : '\/seeker\/dashboard'/);
  assert.match(verifyEmailPage, /result\.data\.user\.role === 'EMPLOYER' \? '\/employer\/jobs' : '\/seeker\/dashboard'/);
});

test('Google duplicate conflict modal has role-aware destinations and use-another-email action', () => {
  assert.match(signUpPage, /existing_role/);
  assert.match(signUpPage, /existingAccountRole === 'EMPLOYER' \? '\/employers\/login' : '\/login'/);
  assert.match(signUpPage, /Use another email/);
});

test('manual employer signup requires company name and company phone', () => {
  assert.match(signUpPage, /role === 'employer' && !form\.companyName\.trim\(\)/);
  assert.match(signUpPage, /role === 'employer' && !form\.phone\.trim\(\)/);
  assert.match(signUpPage, /required=\{role === 'employer'\}/);
});

test('manual generic 202 feedback is neutral and provides safe account actions', () => {
  assert.match(signUpPage, /result\.status === 202 \|\| result\.ok/);
  assert.match(signUpPage, /setShowManualFeedback\(true\)/);
  assert.match(signUpPage, /Registration could not be completed immediately/);
  assert.match(signUpPage, /to="\/login"/);
  assert.match(signUpPage, /Use another email/);
  assert.match(signUpPage, /Continue verification/);
  assert.doesNotMatch(signUpPage, /Account created|Your account has been created|registration was successful/i);
});

test('manual feedback does not introduce account-role lookup or role-dependent sign-in', () => {
  const manualFeedbackStart = signUpPage.indexOf('auth-manual-registration-feedback');
  assert.ok(manualFeedbackStart >= 0);
  const manualFeedbackBlock = signUpPage.slice(manualFeedbackStart);
  assert.doesNotMatch(manualFeedbackBlock, /existingAccountRole|existing_role|account-role/i);
  assert.doesNotMatch(api, /lookup|account.*role|role.*lookup/i);
});
