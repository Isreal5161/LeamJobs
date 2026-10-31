import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_POLICY_VERSION, OPEN_COOKIE_SETTINGS_EVENT, createCookiePreferences, isOptionalCategoryAllowed, parseCookiePreferences, type CookiePreferences } from '../../utils/cookieConsent';

type ChoiceState = { analytics: boolean; marketing: boolean };
const initialChoices: ChoiceState = { analytics: false, marketing: false };

function CookieConsentManager() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [choices, setChoices] = useState<ChoiceState>(initialChoices);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [storageError, setStorageError] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const wasDialogOpen = useRef(false);

  useEffect(() => {
    let saved: CookiePreferences | null = null;
    try {
      saved = parseCookiePreferences(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
    } catch {
      setStorageError('Cookie preferences cannot be read in this browser. Optional categories remain disabled.');
    }
    if (saved?.policyVersion !== COOKIE_POLICY_VERSION) saved = null;
    setPreferences(saved);
    if (saved) setChoices({ analytics: saved.analytics, marketing: saved.marketing });
    setLoaded(true);
  }, []);

  useEffect(() => {
    const openSettings = () => setShowSettings(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const settingsVisible = showSettings || (loaded && !preferences);

  useEffect(() => {
    if (!settingsVisible) {
      if (wasDialogOpen.current) settingsButtonRef.current?.focus();
      wasDialogOpen.current = false;
      return;
    }

    wasDialogOpen.current = true;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('h2')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && preferences) {
        event.preventDefault();
        setShowSettings(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsVisible, preferences]);

  const persist = (next: ChoiceState) => {
    const record = createCookiePreferences(next);
    setChoices(next);
    try { window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record)); setPreferences(record); setStorageError(''); setShowSettings(false); } catch { setPreferences(null); setStorageError('Your choice could not be saved in this browser. Optional categories remain disabled.'); }
  };

  return <>
    <button ref={settingsButtonRef} className="cookie-settings-reopen" type="button" onClick={() => setShowSettings(true)} aria-label="Open cookie settings">Cookie settings</button>
    {settingsVisible ? <div className="cookie-consent-backdrop" role="presentation">
      <section ref={dialogRef} className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
        <div className="cookie-consent__copy">
          <span className="cookie-consent__eyebrow">Your privacy</span>
          <h2 id="cookie-consent-title" tabIndex={-1}>Cookie settings</h2>
          <p>Necessary browser storage supports core site functions. Optional analytics and marketing remain off unless you choose them. We do not currently load optional analytics or advertising scripts.</p>
          <p><Link to="/cookies" onClick={() => setShowSettings(false)}>Read our cookie information</Link></p>
        </div>
        <div className="cookie-consent__categories">
          <label className="cookie-consent__category"><span><strong>Strictly necessary</strong><small>Supports core operation; always active and cannot be switched off here.</small></span><input type="checkbox" checked disabled aria-label="Strictly necessary storage is always active" /></label>
          <label className="cookie-consent__category"><span><strong>Analytics</strong><small>Would help us understand site use. No analytics tags are currently enabled.</small></span><input type="checkbox" checked={choices.analytics} onChange={(event) => setChoices((current) => ({ ...current, analytics: event.target.checked }))} /></label>
          <label className="cookie-consent__category"><span><strong>Marketing</strong><small>Would support advertising measurement or personalization. No marketing tags are currently enabled.</small></span><input type="checkbox" checked={choices.marketing} onChange={(event) => setChoices((current) => ({ ...current, marketing: event.target.checked }))} /></label>
        </div>
        {storageError ? <p className="cookie-consent__error" role="alert">{storageError}</p> : null}
        <div className="cookie-consent__actions">
          {preferences || showSettings ? <button type="button" className="cookie-consent__secondary" onClick={() => setShowSettings(false)}>Close</button> : null}
          <button type="button" className="cookie-consent__secondary" onClick={() => persist(initialChoices)}>Reject optional</button>
          <button type="button" className="cookie-consent__secondary" onClick={() => persist(choices)}>Save choices</button>
          <button type="button" className="cookie-consent__primary" onClick={() => persist({ analytics: true, marketing: true })}>Accept all</button>
        </div>
        <small className="cookie-consent__version">Policy version {COOKIE_POLICY_VERSION}{preferences ? ` · Saved ${new Date(preferences.savedAt).toLocaleString()}` : ''}</small>
      </section>
    </div> : null}
    {loaded && preferences ? <span className="visually-hidden" aria-live="polite">Optional analytics {isOptionalCategoryAllowed(preferences, 'analytics') ? 'allowed by preference' : 'not allowed'}; marketing {isOptionalCategoryAllowed(preferences, 'marketing') ? 'allowed by preference' : 'not allowed'}.</span> : null}
  </>;
}

export default CookieConsentManager;
