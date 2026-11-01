import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const signInPage = readFileSync(new URL('../src/pages/public/SignInPage.tsx', import.meta.url), 'utf8');

test('Google sign-in button starts the existing OAuth endpoint with the selected role only', () => {
  assert.match(signInPage, /onClick=\{handleGoogleSignIn\}/);
  assert.match(signInPage, /role === 'employer' \? 'EMPLOYER' : 'SEEKER'/);
  assert.match(signInPage, /new URLSearchParams\(\{ role: targetRole \}\)/);
  assert.match(signInPage, /\/auth\/google\/start\?\$\{query\.toString\(\)\}/);
  assert.doesNotMatch(signInPage, /acceptedTermsVersion|acceptedPrivacyVersion|termsAccepted|privacyAccepted/);
});

test('Google sign-in gives feedback and prevents duplicate initiation while navigating', () => {
  assert.match(signInPage, /setIsStartingGoogleSignIn\(true\)/);
  assert.match(signInPage, /disabled=\{isStartingGoogleSignIn \|\| isSubmitting \|\| isAuthLoading\}/);
  assert.match(signInPage, /Connecting to Google\.\.\./);
});
