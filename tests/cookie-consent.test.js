import assert from 'node:assert/strict';
import test from 'node:test';
import { COOKIE_POLICY_VERSION, createCookiePreferences, isOptionalCategoryAllowed, parseCookiePreferences } from '../src/utils/cookieConsent.ts';

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

test('preference parser validates fields and forces necessary true', () => {
  const parsed = parseCookiePreferences(JSON.stringify({ necessary: false, analytics: true, marketing: false, savedAt: '2026-10-31T12:00:00.000Z', policyVersion: COOKIE_POLICY_VERSION }));
  assert.equal(parsed?.necessary, true);
  assert.equal(parseCookiePreferences('{bad'), null);
  assert.equal(parseCookiePreferences(JSON.stringify({ analytics: 'yes', marketing: false, savedAt: '', policyVersion: COOKIE_POLICY_VERSION })), null);
});
