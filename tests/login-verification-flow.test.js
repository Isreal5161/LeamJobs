import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const authContext = readSource('../src/context/AuthContext.tsx');
const signInPage = readSource('../src/pages/public/SignInPage.tsx');
const verifyEmailPage = readSource('../src/pages/public/VerifyEmailPage.tsx');
const api = readSource('../src/services/api.ts');

test('verification-required login errors do not store or validate an access token', () => {
  const errorCheck = authContext.indexOf("result.error.code === 'EMAIL_VERIFICATION_REQUIRED'");
  const tokenWrite = authContext.indexOf('writeStoredToken(nextToken)', errorCheck);
  assert.ok(errorCheck >= 0);
  assert.ok(tokenWrite > errorCheck);
  assert.match(authContext, /throw new EmailVerificationRequiredError\(\)/);
  assert.match(api, /errorData\?\.error\?\.code/);
});

test('sign-in sends verification-required accounts to the role-appropriate verification page', () => {
  assert.match(signInPage, /loginError instanceof EmailVerificationRequiredError/);
  assert.match(signInPage, /role === 'employer' \? '\/employers\/verify-email' : '\/verify-email'/);
  assert.match(signInPage, /state: \{ email: email\.trim\(\), verificationRequired: true \}/);
});

test('email verification offers resend and establishes a backend-role-based session', () => {
  assert.match(verifyEmailPage, /verificationRequiredFromLogin/);
  assert.match(verifyEmailPage, /resendEmailVerification\(email\)/);
  assert.match(verifyEmailPage, /setAuthenticatedSession\(result\.data\.token, result\.data\.user\)/);
  assert.match(verifyEmailPage, /result\.data\.user\.role === 'EMPLOYER' \? '\/employer\/jobs' : '\/seeker\/dashboard'/);
  assert.match(api, /endpoint: '\/auth\/verify-email\/resend'/);
});
