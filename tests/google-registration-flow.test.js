import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const verifyEmailPage = readSource('../src/pages/public/VerifyEmailPage.tsx');
const signUpPage = readSource('../src/pages/public/SignUpPage.tsx');
const api = readSource('../src/services/api.ts');
const authContext = readSource('../src/context/AuthContext.tsx');
const signInPage = readSource('../src/pages/public/SignInPage.tsx');
const app = readSource('../src/App.tsx');
const chooseSignInPage = readSource('../src/pages/public/ChooseSignInPage.tsx');
const homeAuthRoleModal = readSource('../src/components/public/HomeAuthRoleModal.tsx');

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

test('manual registration follows the role-specific verification flow without role-bearing response data', () => {
  assert.match(signUpPage, /result\.status === 202/);
  assert.match(signUpPage, /registration: 'pending'/);
  assert.match(signUpPage, /role === 'employer' \? '\/employers\/verify-email' : '\/verify-email'/);
  assert.match(verifyEmailPage, /If this email needs verification, enter the code sent to <strong>\{email\}<\/strong>/);
  assert.match(verifyEmailPage, /handleResend/);
});

test('manual employer signup requires company name and company phone', () => {
  assert.match(signUpPage, /role === 'employer' && !form\.companyName\.trim\(\)/);
  assert.match(signUpPage, /role === 'employer' && !form\.phone\.trim\(\)/);
  assert.match(signUpPage, /required=\{role === 'employer'\}/);
});

test('registration confirmation and duplicate guidance stay role-neutral', () => {
  assert.match(signUpPage, /result\.error\.code === 'EMAIL_ALREADY_REGISTERED'/);
  assert.match(signUpPage, /setAccountConflict\(\{ role: null \}\)/);
  assert.match(signUpPage, /: '\/choose-sign-in'/);
  assert.match(verifyEmailPage, /Choose account type to sign in/);
  assert.match(verifyEmailPage, /to=\{signInPath\}/);
  assert.match(app, /path="choose-sign-in" element=\{<ChooseSignInPage \/>}/);
  assert.match(chooseSignInPage, /<HomeAuthRoleModal mode="signin"/);
  assert.doesNotMatch(signUpPage, /result\.error\.accountRole/);
  assert.doesNotMatch(signUpPage, /Use another email|Continue verification/);
});

test('unverified Google identities receive neutral guidance and a neutral sign-in chooser', () => {
  assert.match(chooseSignInPage, /google_email_unverified/);
  assert.match(chooseSignInPage, /Google could not verify the email address/);
  assert.match(chooseSignInPage, /<HomeAuthRoleModal mode="signin" notice=\{notice\}/);
  assert.match(homeAuthRoleModal, /to=\{employerPath\}/);
  assert.match(homeAuthRoleModal, /to=\{seekerPath\}/);
  assert.match(homeAuthRoleModal, /role="status"/);
  assert.doesNotMatch(chooseSignInPage, /existing_role|accountRole|email=/);
});

test('manual registration verification headings distinguish Seeker and Employer', () => {
  const mainVerificationPage = verifyEmailPage.slice(verifyEmailPage.lastIndexOf('  return ('));
  assert.match(mainVerificationPage, /accountRole === 'employer' \? 'Verify your employer email' : 'Verify your email address'/);
  assert.match(verifyEmailPage, /If this email needs verification, enter the code sent to <strong>\{email\}<\/strong>/);
  assert.match(verifyEmailPage, /resendEmailVerification\(email\)/);
});

test('manual role conflicts navigate to the correct sign-in portal without creating a session', () => {
  assert.match(authContext, /result\.error\.code === 'ROLE_MISMATCH'/);
  assert.match(authContext, /new AccountRoleMismatchError\(result\.error\.accountRole\)/);
  assert.match(signInPage, /loginError instanceof AccountRoleMismatchError/);
  assert.match(signInPage, /Continue to \{roleLabels\[crossRoleConflictRole\]\} Sign In/);
  assert.match(api, /getPublicAccountRole\(errorData\?\.error\?\.details\)/);
});

test('Google OAuth role conflicts return role-aware guidance on sign-in', () => {
  assert.match(signInPage, /oauth_error/);
  assert.match(signInPage, /googleRoleMismatch/);
  assert.match(signInPage, /This Google account is registered as \{roleDescriptions\[googleRoleMismatch\]\}/);
});
