import { FormEvent, useEffect, useState } from 'react';
import { FaBell, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { createSeekerJobAlert, deleteSeekerJobAlert, getSeekerJobAlerts, updateSeekerJobAlert, type JobAlert } from '../../services/api';

const emptyForm = { name: '', keywords: '', location: '', salaryMin: '', salaryMax: '', jobType: '' as '' | 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT', workArrangement: '' as '' | 'REMOTE' | 'HYBRID' | 'ONSITE' };

type JobAlertFormError = { title: string; message: string } | null;

const toJobAlertFormError = (code?: string, message?: string): JobAlertFormError => {
  const normalizedMessage = message?.trim();

  if (code === 'VALIDATION_ERROR') {
    if (normalizedMessage && /minimum salary cannot (?:exceed|be higher than) maximum salary/i.test(normalizedMessage)) {
      return {
        title: 'Invalid salary range',
        message: 'Minimum salary cannot be higher than maximum salary. Please enter a maximum salary greater than or equal to the minimum salary, or leave the maximum salary empty.',
      };
    }

    if (normalizedMessage) {
      return {
        title: 'Please check your alert details',
        message: normalizedMessage,
      };
    }

    return {
      title: 'Please check your alert details',
      message: 'Please review the information and try again.',
    };
  }

  return {
    title: 'We could not create this alert',
    message: normalizedMessage || 'Please try again.',
  };
};

function JobAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [limits, setLimits] = useState<{ alerts: number; planKey: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<JobAlertFormError>(null);

  const load = async () => {
    if (!token) return;
    setIsLoading(true);
    const result = await getSeekerJobAlerts(token);
    if (result.ok) { setAlerts(result.data.data.items); setLimits(result.data.data.limits); setError(null); }
    else setError({ title: 'We could not load your job alerts', message: result.error.message || 'Please try again.' });
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || isSaving) return;
    setIsSaving(true); setError(null);
    const result = await createSeekerJobAlert({ name: form.name, keywords: form.keywords || null, skills: [], location: form.location || null, jobType: form.jobType || null, workArrangement: form.workArrangement || null, salaryMin: form.salaryMin ? Number(form.salaryMin) : null, salaryMax: form.salaryMax ? Number(form.salaryMax) : null, isActive: true }, token);
    if (result.ok) { setForm(emptyForm); await load(); } else setError(toJobAlertFormError(result.error.code, result.error.message));
    setIsSaving(false);
  };

  const toggle = async (alert: JobAlert) => {
    if (!token) return;
    const result = await updateSeekerJobAlert(alert.id, { isActive: !alert.isActive }, token);
    if (result.ok) setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, isActive: !item.isActive } : item));
    else setError(toJobAlertFormError(result.error.code, result.error.message));
  };

  const remove = async (alertId: string) => {
    if (!token) return;
    const result = await deleteSeekerJobAlert(alertId, token);
    if (result.ok) setAlerts((current) => current.filter((item) => item.id !== alertId));
    else setError(toJobAlertFormError(result.error.code, result.error.message));
  };

  return <main className="seeker-layout__main job-alerts-page">
    <section className="job-alerts-page__hero"><span><FaBell aria-hidden="true" /> Personalized notifications</span><h1>Job alerts</h1><p>Save supported search criteria and receive relevant opportunities through the platform’s delivery system.</p></section>
    <section className="seeker-card job-alerts-page__panel"><div className="job-alerts-page__heading"><div><h2>Create an alert</h2><p>{limits?.alerts === null || limits?.alerts === undefined ? 'Your plan limit is loading.' : Number.isFinite(limits.alerts) ? `${alerts.length} of ${limits.alerts} alerts used` : 'Unlimited alerts on your plan.'}</p></div></div>
      <form className="job-alerts-form" onSubmit={submit}><label><span>Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Frontend roles in Lagos" /></label><label><span>Keywords</span><input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="React, TypeScript" /></label><label><span>Location</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Any location" /></label><label><span>Minimum salary</span><input type="number" min="0" value={form.salaryMin} onChange={(event) => setForm({ ...form, salaryMin: event.target.value })} placeholder="Any" /></label><label><span>Maximum salary</span><input type="number" min="0" value={form.salaryMax} onChange={(event) => setForm({ ...form, salaryMax: event.target.value })} placeholder="Any" /></label><label><span>Job type</span><select value={form.jobType} onChange={(event) => setForm({ ...form, jobType: event.target.value as typeof form.jobType })}><option value="">Any job type</option><option value="NORMAL_EMPLOYMENT">Employment</option><option value="FREELANCE_PROJECT">Freelance project</option></select></label><label><span>Work arrangement</span><select value={form.workArrangement} onChange={(event) => setForm({ ...form, workArrangement: event.target.value as typeof form.workArrangement })}><option value="">Any arrangement</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label><button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create alert'}</button></form>
      {error ? <div className="job-alerts-page__alert" role="alert" aria-live="polite"><div className="job-alerts-page__alert-icon" aria-hidden="true">!</div><div><strong>{error.title}</strong><p>{error.message}</p></div></div> : null}
    </section>
    <section className="seeker-card job-alerts-page__panel"><div className="job-alerts-page__heading"><div><h2>Active alerts</h2><p>Manage delivery without changing your saved criteria.</p></div></div>{isLoading ? <p role="status">Loading alerts...</p> : alerts.length === 0 ? <div className="job-alerts-page__empty"><FaBell aria-hidden="true" /><p>No alerts yet.</p></div> : <div className="job-alert-list">{alerts.map((alert) => <article className="job-alert-item" key={alert.id}><div><strong>{alert.name}</strong><span>{[alert.keywords, alert.location, alert.jobType?.replaceAll('_', ' ')].filter(Boolean).join(' · ') || 'All supported jobs'}</span></div><label className="job-alert-toggle"><input type="checkbox" checked={alert.isActive} onChange={() => void toggle(alert)} /><span>{alert.isActive ? 'Active' : 'Paused'}</span></label><button type="button" onClick={() => void remove(alert.id)} aria-label={`Delete ${alert.name}`}><FaTrash /></button></article>)}</div>}</section>
  </main>;
}

export default JobAlertsPage;