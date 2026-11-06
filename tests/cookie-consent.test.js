import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { COOKIE_POLICY_VERSION, createCookiePreferences, isOptionalCategoryAllowed, parseCookiePreferences } from '../src/utils/cookieConsent.ts';
import { legalDocumentMetadata, LEGAL_REGISTRATION_ACCEPTANCE, PRIVACY_POLICY_VERSION, TERMS_POLICY_VERSION } from '../src/utils/legalVersions.ts';

test('Terms, Privacy, Freelancer Terms, and Employer Terms use approved version 1.0', async () => {
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

  for (const document of ['freelancer', 'employer']) {
    assert.equal(legalDocumentMetadata[document].status, 'approved');
    assert.equal(legalDocumentMetadata[document].version, '1.0');
    assert.equal(legalDocumentMetadata[document].effectiveDate, undefined);
  }

  assert.equal(legalDocumentMetadata.cookies.status, 'approved');
  assert.equal(legalDocumentMetadata.cookies.version, '1.0');
  assert.equal(legalDocumentMetadata.cookies.effectiveDate, undefined);
  assert.equal(legalDocumentMetadata.payments.status, 'approved');
  assert.equal(legalDocumentMetadata.payments.version, '1.0');
  assert.equal(legalDocumentMetadata.payments.effectiveDate, undefined);

  const [signupPage, legalPage] = await Promise.all([
    readFile(new URL('../src/pages/public/SignUpPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/public/LegalPage.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(signupPage, /\.\.\.LEGAL_REGISTRATION_ACCEPTANCE/);
  assert.match(legalPage, /metadata\.status === 'draft' \?/);
  assert.match(legalPage, /metadata\.effectiveDate \?/);
  for (const approvedIntro of [
    'These supplemental terms apply to freelancers',
    'These supplemental terms apply to employers',
  ]) {
    assert.match(legalPage, new RegExp(approvedIntro));
  }
  assert.doesNotMatch(legalPage, /These draft supplemental terms apply to (?:freelancers|employers)/);
  assert.doesNotMatch(legalPage, /They require Company and qualified legal-counsel review/);
});

test('approved Cookie Policy has no draft label, disclaimer, or pending approval text', async () => {
  const legalPage = await readFile(new URL('../src/pages/public/LegalPage.tsx', import.meta.url), 'utf8');
  const cookieStart = legalPage.indexOf('  cookies: {');
  const paymentsStart = legalPage.indexOf('  payments: {');
  const cookiePolicy = legalPage.slice(cookieStart, paymentsStart);

  assert.ok(cookieStart >= 0);
  assert.ok(paymentsStart > cookieStart);
  assert.match(cookiePolicy, /This Cookie Policy describes the frontend storage/);
  assert.match(cookiePolicy, /The Company should keep this inventory current/);
  assert.doesNotMatch(cookiePolicy, /draft|pending|before publication|not legal advice/i);
});

test('approved Payment Policy has no draft label, disclaimer, or pending provider confirmation', async () => {
  const legalPage = await readFile(new URL('../src/pages/public/LegalPage.tsx', import.meta.url), 'utf8');
  const paymentsStart = legalPage.indexOf('  payments: {');
  const freelancerStart = legalPage.indexOf('  freelancer: {');
  const paymentPolicy = legalPage.slice(paymentsStart, freelancerStart);

  assert.ok(paymentsStart >= 0);
  assert.ok(freelancerStart > paymentsStart);
  assert.equal(legalDocumentMetadata.payments.status, 'approved');
  assert.equal(legalDocumentMetadata.payments.version, '1.0');
  assert.match(legalPage, /<div><dt>Version<\/dt><dd>\{metadata\.version\}<\/dd><\/div>/);
  assert.match(paymentPolicy, /Payment features and availability/);
  assert.match(paymentPolicy, /Contract funding and escrow status/);
  assert.match(paymentPolicy, /Refunds, cancellations and disputes/);
  assert.match(paymentPolicy, /Withdrawals and payouts/);
  assert.match(paymentPolicy, /Paystack collection for NGN contract funding/);
  assert.match(paymentPolicy, /Flutterwave payment initialization and verification/);
  assert.match(paymentPolicy, /safeguarding arrangements, release conditions, insolvency treatment/);
  assert.match(paymentPolicy, /fees are supplied through a configured fee schedule/);
  assert.match(paymentPolicy, /provider settlement, contract status, transaction history/);
  assert.match(paymentPolicy, /pending-withdrawal balance/);
  assert.doesNotMatch(paymentPolicy, /draft|pending.{0,30}confirm|before this Policy is published|must be confirmed|require Company and legal confirmation/i);
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

test('cookie settings remain available from the footer without a floating reopen button', async () => {
  const [component, footer, styles] = await Promise.all([
    readFile(new URL('../src/components/public/CookieConsentManager.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/layout/Footer.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/styles/legal-cookie-consent.css', import.meta.url), 'utf8'),
  ]);
  assert.doesNotMatch(component, /cookie-settings-reopen/);
  assert.doesNotMatch(styles, /cookie-settings-reopen/);
  assert.match(component, /window\.addEventListener\(OPEN_COOKIE_SETTINGS_EVENT, openSettings\)/);
  assert.match(component, /onClick=\{\(\) => persist\(initialChoices\)\}/);
  assert.match(component, /onClick=\{\(\) => persist\(choices\)\}/);
  assert.match(component, /onClick=\{\(\) => persist\(\{ analytics: true, marketing: true \}\)\}/);
  assert.match(footer, /dispatchEvent\(new Event\(OPEN_COOKIE_SETTINGS_EVENT\)\)/);
});

test('preference parser validates fields and forces necessary true', () => {
  const parsed = parseCookiePreferences(JSON.stringify({ necessary: false, analytics: true, marketing: false, savedAt: '2026-10-31T12:00:00.000Z', policyVersion: COOKIE_POLICY_VERSION }));
  assert.equal(parsed?.necessary, true);
  assert.equal(parseCookiePreferences('{bad'), null);
  assert.equal(parseCookiePreferences(JSON.stringify({ analytics: 'yes', marketing: false, savedAt: '', policyVersion: COOKIE_POLICY_VERSION })), null);
});
