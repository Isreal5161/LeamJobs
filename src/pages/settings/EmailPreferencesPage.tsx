import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  acceptCurrentLegalDocuments,
  getEmailPreferences,
  getLegalAcceptanceStatus,
  updateEmailPreferences,
  type LegalAcceptanceStatus,
} from '../../services/api';
import { OPEN_COOKIE_SETTINGS_EVENT } from '../../utils/cookieConsent';
import { PRIVACY_POLICY_VERSION, TERMS_POLICY_VERSION } from '../../utils/legalVersions';

type SettingsPageProps = { role: 'seeker' | 'employer' | 'admin' };

function SettingsPage({ role }: SettingsPageProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [legalStatus, setLegalStatus] = useState<LegalAcceptanceStatus | null>(null);
  const [legalLoading, setLegalLoading] = useState(true);
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [savingLegal, setSavingLegal] = useState(false);

  useEffect(() => {
    if (!token) return;
    void getEmailPreferences(token).then((result) => {
      if (result.ok) setMarketingEnabled(result.data.data.marketingEmailsEnabled);
      else setError(result.error.message || 'Unable to load email preferences.');
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void getLegalAcceptanceStatus(token).then((result) => {
      if (result.ok) setLegalStatus(result.data.data);
      else setError(result.error.message || 'Unable to load document acceptance status.');
      setLegalLoading(false);
    });
  }, [token]);

  const handleChange = async (enabled: boolean) => {
    if (!token) return;
    setSaving(true);
    setFeedback('');
    setError('');
    const result = await updateEmailPreferences(token, enabled);
    if (result.ok) { setMarketingEnabled(result.data.data.marketingEmailsEnabled); setFeedback('Marketing email preference updated.'); }
    else setError(result.error.message || 'Unable to update email preferences.');
    setSaving(false);
  };

  const handleLegalAcceptance = async () => {
    if (!token || !termsAcknowledged || !privacyAcknowledged) return;
    setSavingLegal(true);
    setFeedback('');
    setError('');
    const result = await acceptCurrentLegalDocuments(token, {
      termsAccepted: true,
      privacyAccepted: true,
      acceptedTermsVersion: TERMS_POLICY_VERSION,
      acceptedPrivacyVersion: PRIVACY_POLICY_VERSION,
    });
    if (result.ok) {
      setLegalStatus(result.data.data);
      setTermsAcknowledged(false);
      setPrivacyAcknowledged(false);
      setFeedback('Your acknowledgement of the current Terms and Conditions and Privacy Policy has been recorded.');
    } else {
      setError(result.error.message || 'Unable to save document acceptance.');
    }
    setSavingLegal(false);
  };

  const requiresLegalAcceptance = Boolean(legalStatus
    && (!legalStatus.terms.acceptedAt || !legalStatus.privacy.acceptedAt));

  return (
    <main className="email-preferences-page">
      <button type="button" className="email-preferences-back" onClick={() => navigate(`/${role}/dashboard`)}>
        <FaArrowLeft /> Back to dashboard
      </button>
      <header className="email-preferences-heading">
        <span><FaEnvelope /> Account settings</span>
        <h1>Settings</h1>
        <p>Manage your account and communication preferences.</p>
      </header>
      {error ? <p className="email-preferences-feedback email-preferences-feedback--error" role="alert">{error}</p> : null}
      {feedback ? <p className="email-preferences-feedback" role="status">{feedback}</p> : null}
      <section className="email-preferences-panel" aria-labelledby="email-preferences-title">
        <div className="email-preferences-panel__heading">
          <div>
            <span className="email-preferences-panel__eyebrow">Email &amp; notifications</span>
            <h2 id="email-preferences-title">Optional communications</h2>
            <p>Choose whether LeamJobs can send optional job recommendations, platform updates, and marketing messages.</p>
          </div>
        </div>
        {loading ? (
          <div className="email-preferences-loading" aria-busy="true" aria-label="Loading email preferences"><span /><span /><span /></div>
        ) : (
          <label className="email-preferences-toggle">
            <span className="email-preferences-toggle__control"><input type="checkbox" checked={marketingEnabled} onChange={(event) => void handleChange(event.target.checked)} disabled={saving} /><span aria-hidden="true" /></span>
            <span><strong>Receive optional job updates and marketing emails</strong><small>These messages are separate from essential account and service notifications.</small></span>
          </label>
        )}
        <div className="email-preferences-transactional">
          <FaLock aria-hidden="true" />
          <div><strong>Important account emails always remain enabled</strong><span>Password resets, application activity, invitations, payment failures, subscription lifecycle updates, and important contract messages are transactional service communications.</span></div>
        </div>
      </section>
      <section className="email-preferences-panel" aria-labelledby="privacy-controls-title">
        <div className="email-preferences-panel__heading">
          <div>
            <span className="email-preferences-panel__eyebrow">Privacy</span>
            <h2 id="privacy-controls-title">Your privacy choices and requests</h2>
            <p>Read the <Link to="/privacy">Privacy Policy</Link> or review our <Link to="/terms">Terms and Conditions</Link>. Cookie preferences are separate from email preferences.</p>
            <p>To request access to or correction or deletion of personal data, contact us through the <Link to="/contact">Contact page</Link>. Requests are reviewed under applicable law and account, financial and contractual retention requirements; this page does not automatically delete records.</p>
            {legalLoading ? <p aria-busy="true">Loading document acceptance status…</p> : null}
            {!legalLoading && legalStatus && !requiresLegalAcceptance ? (
              <p role="status">You have acknowledged the current document versions (Terms {legalStatus.terms.version}; Privacy {legalStatus.privacy.version}).</p>
            ) : null}
            {!legalLoading && requiresLegalAcceptance ? (
              <div className="legal-acceptance-renewal">
                <p>Current documents require acknowledgement. This reminder does not restrict your account access.</p>
                <label><input type="checkbox" checked={termsAcknowledged} onChange={(event) => setTermsAcknowledged(event.target.checked)} /> I have read and agree to the <Link to="/terms">Terms and Conditions</Link> (version {legalStatus?.terms.version}).</label>
                <label><input type="checkbox" checked={privacyAcknowledged} onChange={(event) => setPrivacyAcknowledged(event.target.checked)} /> I acknowledge that I have read the <Link to="/privacy">Privacy Policy</Link> (version {legalStatus?.privacy.version}).</label>
                <button type="button" className="email-preferences-back" disabled={!termsAcknowledged || !privacyAcknowledged || savingLegal} onClick={() => void handleLegalAcceptance()}>
                  {savingLegal ? 'Saving acknowledgement…' : 'Acknowledge current documents'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" className="email-preferences-back" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}>
          Manage cookie preferences
        </button>
      </section>
    </main>
  );
}

export default SettingsPage;
