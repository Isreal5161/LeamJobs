import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getEmailPreferences, updateEmailPreferences } from '../../services/api';

type SettingsPageProps = { role: 'seeker' | 'employer' | 'admin' };

function SettingsPage({ role }: SettingsPageProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    void getEmailPreferences(token).then((result) => {
      if (result.ok) setMarketingEnabled(result.data.data.marketingEmailsEnabled);
      else setError(result.error.message || 'Unable to load email preferences.');
      setLoading(false);
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
    </main>
  );
}

export default SettingsPage;
