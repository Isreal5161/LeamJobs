export const COOKIE_POLICY_VERSION = '2026-10-31';
export const COOKIE_CONSENT_STORAGE_KEY = 'leamjobs_cookie_preferences';
export const OPEN_COOKIE_SETTINGS_EVENT = 'leamjobs:open-cookie-settings';

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
  policyVersion: string;
};

export function parseCookiePreferences(raw: string | null): CookiePreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CookiePreferences>;
    if (typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean'
      || typeof value.savedAt !== 'string' || Number.isNaN(Date.parse(value.savedAt))
      || typeof value.policyVersion !== 'string' || !value.policyVersion) return null;
    return { necessary: true, analytics: value.analytics, marketing: value.marketing,
      savedAt: value.savedAt, policyVersion: value.policyVersion };
  } catch { return null; }
}

export function createCookiePreferences(
  choices: { analytics: boolean; marketing: boolean }, now = new Date(),
): CookiePreferences {
  return { necessary: true, analytics: choices.analytics, marketing: choices.marketing,
    savedAt: now.toISOString(), policyVersion: COOKIE_POLICY_VERSION };
}

/** Gate any future optional integration before it is initialized or its script is loaded. */
export function isOptionalCategoryAllowed(
  preferences: CookiePreferences | null, category: 'analytics' | 'marketing',
): boolean {
  return preferences?.policyVersion === COOKIE_POLICY_VERSION && preferences[category] === true;
}
