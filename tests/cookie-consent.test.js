import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { COOKIE_POLICY_VERSION, createCookiePreferences, isOptionalCategoryAllowed, parseCookiePreferences } from '../src/utils/cookieConsent.ts';
import { legalDocumentMetadata, LEGAL_REGISTRATION_ACCEPTANCE, PRIVACY_POLICY_VERSION, TERMS_POLICY_VERSION } from '../src/utils/legalVersions.ts';

test('Terms and Privacy use approved version 1.0 while other legal documents remain drafts', async () => {
  assert.equal(TERMS_POLICY_VERSION, '1.0');
  assert.equal(PRIVACY_POLICY_VERSION, '1.0');
  assert.deepEqual(LEGAL_REGISTRATION_ACCEPTANCE, {
    termsAccepted: true,
    privacyAccepted: true,
    acceptedTermsVersion: '1.0',
    acceptedPrivacyVersion: '1.0',
  });
  assert.deepEqual(
    ['terms', 'privacy'].map((document) => legalDocumentMetadata[document].status),
    ['approved', 'approved'],
  );
  assert.deepEqual(
    ['terms', 'privacy'].map((document) => legalDocumentMetadata[document].version),
    ['1.0', '1.0'],
  );

  for (const document of ['cookies', 'payments', 'freelancer', 'employer']) {
    assert.equal(legalDocumentMetadata[document].status, 'draft');
    assert.equal(legalDocumentMetadata[document].version, '1.0-draft');
  }

  const [signupPage, legalPage] = await Promise.all([
    readFile(new URL('../src/pages/public/SignUpPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/public/LegalPage.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(signupPage, /\.\.\.LEGAL_REGISTRATION_ACCEPTANCE/);
  assert.match(legalPage, /metadata\.status === 'draft' \?/);
  assert.match(legalPage, /metadata\.effectiveDate \?/);
});

test('new consent defaults deny optional categories and always enables necessary storage', () => {
  const preferences = createCookiePreferences({ analytics: false, marketing: false }, new Date('2026-10-31T12:00:00.000Z'));
  assert.equal(preferences.necessary, true);
  assert.equal(preferences.analytics, false);
  assert.equal(preferences.marketing, false);
  assert.equal(preferences.savedAt, '2026-10-31T12:00:00.000Z');
  assert.equal(preferences.policyVersion, COOKIE_POLICY_VERSION);
  assert.equal(isOptionalCategoryAllowed(preferences, 'analytics'), false);
  assert.equal(isOptionalCategoryAllowed(preferences, 'marketing'), false);
});

test('only matching current-version preferences authorize a future optional category', () => {
  const preferences = createCookiePreferences({ analytics: true, marketing: false });
  assert.equal(isOptionalCategoryAllowed(preferences, 'analytics'), true);
  assert.equal(isOptionalCategoryAllowed(preferences, 'marketing'), false);
  assert.equal(isOptionalCategoryAllowed({ ...preferences, policyVersion: 'old' }, 'analytics'), false);
  assert.equal(isOptionalCategoryAllowed(null, 'analytics'), false);
});

test('custom preferences and rejection preserve each optional category choice', () => {
  const custom = createCookiePreferences({ analytics: true, marketing: false });
  assert.equal(isOptionalCategoryAllowed(custom, 'analytics'), true);
  assert.equal(isOptionalCategoryAllowed(custom, 'marketing'), false);

  const accepted = createCookiePreferences({ analytics: true, marketing: true });
  assert.equal(isOptionalCategoryAllowed(accepted, 'analytics'), true);
  assert.equal(isOptionalCategoryAllowed(accepted, 'marketing'), true);

  const rejected = createCookiePreferences({ analytics: false, marketing: false });
  assert.equal(isOptionalCategoryAllowed(rejected, 'analytics'), false);
  assert.equal(isOptionalCategoryAllowed(rejected, 'marketing'), false);
});

test('cookie consent status uses the existing screen-reader-only class', async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL('../src/components/public/CookieConsentManager.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/seeker-home.css', import.meta.url), 'utf8'),
  ]);
  assert.match(component, /className="sr-only" aria-live="polite"/);
  assert.match(styles, /\.sr-only\s*\{/);
});

test('preference parser validates fields and forces necessary true', () => {
  const parsed = parseCookiePreferences(JSON.stringify({ necessary: false, analytics: true, marketing: false, savedAt: '2026-10-31T12:00:00.000Z', policyVersion: COOKIE_POLICY_VERSION }));
  assert.equal(parsed?.necessary, true);
  assert.equal(parseCookiePreferences('{bad'), null);
  assert.equal(parseCookiePreferences(JSON.stringify({ analytics: 'yes', marketing: false, savedAt: '', policyVersion: COOKIE_POLICY_VERSION })), null);
});
