import { FormEvent, useEffect, useState } from 'react';
import { FaChartLine, FaHeadset, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { createPremiumSupportRequest, getCareerRecommendations, getPremiumSupportRequests, getSalaryInsights } from '../../services/api';

function PremiumInsightsPage() {
  const { token } = useAuth();
  const [career, setCareer] = useState<{ title: string; score: number; matchedSkills: string[] }[]>([]);
  const [salary, setSalary] = useState<{ sampleSize: number; message?: string; minimum?: number; maximum?: number; average?: number; currency?: string | null }>({ sampleSize: 0 });
  const [support, setSupport] = useState<{ id: string; subject: string; category: string; message: string; status: string; response: string | null; createdAt: string }[]>([]);
  const [supportForm, setSupportForm] = useState({ subject: '', category: 'ACCOUNT', message: '' });
  const [loading, setLoading] = useState(true);
  const [supportError, setSupportError] = useState('');
  const [careerError, setCareerError] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [supportLoadError, setSupportLoadError] = useState('');
  const [supportSaving, setSupportSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    void Promise.all([getCareerRecommendations(token), getSalaryInsights(token), getPremiumSupportRequests(token)]).then(([careerResult, salaryResult, supportResult]) => {
      if (careerResult.ok) setCareer(careerResult.data.data.recommendations);
      else setCareerError(careerResult.status === 403 ? 'Career recommendations are not enabled for this plan.' : 'Career recommendations could not be loaded.');
      if (salaryResult.ok) setSalary(salaryResult.data.data);
      else setSalaryError(salaryResult.status === 403 ? 'Salary insights are not enabled for this plan.' : 'Salary insights could not be loaded.');
      if (supportResult.ok) setSupport(supportResult.data.data.items);
      else setSupportLoadError(supportResult.status === 403 ? 'Premium Support is not enabled for this plan.' : 'Support requests could not be loaded.');
      setLoading(false);
    });
  }, [token]);

  const submitSupport = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || supportSaving) return;
    setSupportSaving(true); setSupportError('');
    const result = await createPremiumSupportRequest(supportForm, token);
    if (result.ok) { setSupportForm({ subject: '', category: 'ACCOUNT', message: '' }); const refreshed = await getPremiumSupportRequests(token); if (refreshed.ok) setSupport(refreshed.data.data.items); }
    else setSupportError(result.error.message || 'We could not create your support request.');
    setSupportSaving(false);
  };

  return <main className="seeker-layout__main premium-insights-page">
    <section className="premium-insights-page__hero"><span><FaChartLine aria-hidden="true" /> Premium intelligence</span><h1>Career insights</h1><p>Recommendations and salary summaries are calculated from published jobs and your actual profile data.</p></section>
    <section className="seeker-card premium-insights-panel"><div className="premium-insights-panel__heading"><div><h2>Career directions</h2><p>Role suggestions based on your profile skills and approved jobs.</p></div><FaLightbulb aria-hidden="true" /></div>{loading ? <p role="status">Loading career recommendations...</p> : careerError ? <p role="alert" className="premium-insights-error">{careerError}</p> : career.length ? <div className="premium-insights-list">{career.map((item) => <article key={item.title}><strong>{item.title}</strong><span>{item.score} matched skills</span><small>{item.matchedSkills.join(', ') || 'No direct skill matches'}</small></article>)}</div> : <p>No matching career directions were found from the current approved-job data.</p>}</section>
    <section className="seeker-card premium-insights-panel"><div className="premium-insights-panel__heading"><div><h2>Salary summary</h2><p>Only published salary data is included. No market figures are invented.</p></div><FaChartLine aria-hidden="true" /></div>{loading ? <p role="status">Loading salary data...</p> : salaryError ? <p role="alert" className="premium-insights-error">{salaryError}</p> : salary.sampleSize ? <div className="premium-salary-summary"><strong>{salary.currency ?? ''} {salary.average}</strong><span>Published average from {salary.sampleSize} salary values</span><small>{salary.currency ?? ''} {salary.minimum} - {salary.maximum}</small></div> : <p>{salary.message || 'There is not enough published salary data for this comparison.'}</p>}</section>
    <section className="seeker-card premium-insights-panel"><div className="premium-insights-panel__heading"><div><h2>Premium support</h2><p>Send a request to the LeamJobs support team and track its status here.</p></div><FaHeadset aria-hidden="true" /></div>{supportLoadError ? <p role="alert" className="premium-insights-error">{supportLoadError}</p> : <><form className="premium-support-form" onSubmit={submitSupport}><input required placeholder="Subject" value={supportForm.subject} onChange={(event) => setSupportForm({ ...supportForm, subject: event.target.value })} /><select value={supportForm.category} onChange={(event) => setSupportForm({ ...supportForm, category: event.target.value })}><option value="ACCOUNT">Account</option><option value="SUBSCRIPTION">Subscription</option><option value="TECHNICAL">Technical</option><option value="OTHER">Other</option></select><textarea required minLength={10} rows={4} placeholder="Describe what you need help with" value={supportForm.message} onChange={(event) => setSupportForm({ ...supportForm, message: event.target.value })} /><button type="submit" disabled={supportSaving}>{supportSaving ? 'Sending...' : 'Create support request'}</button></form>{supportError ? <p role="alert" className="premium-insights-error">{supportError}</p> : null}<div className="premium-support-list">{support.map((item) => <article key={item.id}><div><strong>{item.subject}</strong><span>{item.category} · {item.status}</span></div>{item.response ? <p>{item.response}</p> : <small>Awaiting support response</small>}</article>)}</div></>}</section>
  </main>;
}

export default PremiumInsightsPage;