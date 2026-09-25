import { useMemo, useState } from 'react';
import { FaBriefcase, FaChartLine, FaCheckCircle, FaCrown, FaFileAlt, FaMagic, FaSearch, FaUserShield } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAccountTypeLabel, useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { requestCareerAssistant, type CareerAssistantResult } from '../../services/api';

type PremiumFeature = { key: string; title: string; description: string; icon: typeof FaMagic; action?: string; to?: string };

const sections: Array<{ title: string; features: PremiumFeature[] }> = [
  { title: 'AI Career Tools', features: [
    { key: 'AI_CV_IMPROVEMENT', title: 'AI CV improvement', description: 'Improve CV content with structured, editable suggestions.', icon: FaMagic, action: 'Open profile', to: '/seeker/profile' },
    { key: 'AI_COVER_LETTER', title: 'AI cover letters', description: 'Draft job-specific cover letters from real job and profile data.', icon: FaFileAlt, action: 'View applications', to: '/seeker/applications' },
    { key: 'AI_INTERVIEW_PREPARATION', title: 'Interview preparation', description: 'Generate role-specific questions and preparation guidance.', icon: FaBriefcase },
    { key: 'AI_CAREER_ASSISTANT', title: 'Career assistant', description: 'Get scoped career guidance grounded in your profile.', icon: FaMagic },
  ] },
  { title: 'Career Intelligence', features: [
    { key: 'PRIORITY_RECOMMENDATIONS', title: 'Priority recommendations', description: 'See a larger, skill-ranked recommendation window.', icon: FaChartLine, action: 'Browse recommendations', to: '/seeker/jobs' },
    { key: 'PROFILE_STRENGTH', title: 'Advanced profile strength', description: 'See real profile dimensions and actionable gaps.', icon: FaUserShield, action: 'Open profile', to: '/seeker/profile' },
    { key: 'SALARY_CAREER_INSIGHTS', title: 'Salary and career insights', description: 'Compare published salary data where enough real data exists.', icon: FaChartLine },
  ] },
  { title: 'Premium Benefits', features: [
    { key: 'SEARCH_FILTERS', title: 'Advanced search and filters', description: 'Search approved jobs using the supported job criteria.', icon: FaSearch, action: 'Search jobs', to: '/seeker/jobs' },
    { key: 'APPLICATION_TRACKING', title: 'Full application tracking', description: 'Track application status, interviews, and progress in one place.', icon: FaBriefcase, action: 'View applications', to: '/seeker/applications' },
    { key: 'PROFILE_VISIBILITY_BOOST', title: 'Profile visibility boost', description: 'Your eligible profile is prioritized in employer candidate discovery.', icon: FaUserShield },
    { key: 'PREMIUM_SUPPORT', title: 'Premium support', description: 'Send and track a support request from your account.', icon: FaCheckCircle },
  ] },
];

function PremiumOverviewPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentPlan, aiUsage, trial } = useSubscriptions();
  const planKey = currentPlan?.key?.toUpperCase() ?? 'BASIC';
  const entitlements = useMemo(() => new Set((currentPlan?.entitlements ?? []).map((item) => item.toUpperCase())), [currentPlan?.entitlements]);
  const planLabel = getAccountTypeLabel(planKey, 'Basic');
  const availableSections = sections.map((section) => ({ ...section, features: section.features.map((feature) => ({ ...feature, available: feature.key === 'PROFILE_STRENGTH' ? planKey === 'PREMIUM' && entitlements.has(feature.key) : entitlements.has(feature.key) })) }));
  const [assistantQuestion, setAssistantQuestion] = useState('What should I focus on next in my job search?');
  const [assistantResult, setAssistantResult] = useState<CareerAssistantResult | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const runAssistant = async () => {
    if (!token || assistantLoading || !assistantQuestion.trim()) return;
    setAssistantLoading(true); setAssistantError('');
    const result = await requestCareerAssistant({ question: assistantQuestion.trim() }, token);
    if (result.ok) setAssistantResult(result.data.data);
    else setAssistantError(result.error.message || 'Career assistant is unavailable.');
    setAssistantLoading(false);
  };

  return (
    <main className="seeker-layout__main premium-overview-page">
      <section className="premium-overview-hero">
        <div>
          <span className="premium-overview-hero__eyebrow"><FaCrown aria-hidden="true" /> Career workspace</span>
          <h1>{planLabel} tools</h1>
          <p>One place for the career tools and account benefits enabled by your resolved plan.</p>
        </div>
        <div className="premium-overview-hero__plan"><strong>{planLabel}</strong><span>{trial ? `Trial ends ${new Date(trial.endAt).toLocaleDateString()}` : 'Current plan'}</span></div>
      </section>

      <section className="premium-overview-stat-grid" aria-label="Plan status">
        <article><span>Plan</span><strong>{planLabel}</strong><small>{currentPlan?.description ?? 'Your current account plan'}</small></article>
        <article><span>AI used</span><strong>{aiUsage.unlimited ? `${aiUsage.used}` : `${aiUsage.used} / ${aiUsage.limit ?? 0}`}</strong><small>{aiUsage.unlimited ? 'Unlimited allowance' : `${aiUsage.remaining} remaining`}</small></article>
        <article><span>Status</span><strong><FaCheckCircle aria-hidden="true" /> Active</strong><small>{trial ? 'Active trial entitlement' : 'Resolved from subscription state'}</small></article>
      </section>

      {entitlements.has('AI_CAREER_ASSISTANT') ? <section className="premium-overview-section premium-assistant-panel"><div className="premium-overview-section__heading"><div><span>AI career tool</span><h2>Career assistant</h2></div></div><p>Ask a career-focused question using your authenticated profile context. Responses are suggestions, not automatic actions.</p><textarea value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} rows={3} maxLength={1500} /><button type="button" onClick={() => void runAssistant()} disabled={assistantLoading}>{assistantLoading ? 'Thinking...' : 'Ask career assistant'}</button>{assistantError ? <p className="premium-assistant-panel__error" role="alert">{assistantError}</p> : null}{assistantResult ? <div className="premium-assistant-panel__result"><strong>{assistantResult.answer}</strong>{assistantResult.nextSteps.length ? <ul>{assistantResult.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul> : null}</div> : null}</section> : null}

      {availableSections.map((section) => (
        <section className="premium-overview-section" key={section.title}>
          <div className="premium-overview-section__heading"><div><span>Plan capability</span><h2>{section.title}</h2></div></div>
          <div className="premium-feature-grid">
            {section.features.map((feature) => {
              const Icon = feature.icon;
              return <article className={`premium-feature-card ${feature.available ? '' : 'premium-feature-card--unavailable'}`} key={feature.key}>
                <div className="premium-feature-card__icon"><Icon aria-hidden="true" /></div>
                <div className="premium-feature-card__content"><div className="premium-feature-card__title"><h3>{feature.title}</h3><span>{feature.available ? 'Available' : 'Not enabled'}</span></div><p>{feature.description}</p>{feature.available && feature.action && feature.to ? <button type="button" onClick={() => { if (feature.to) navigate(feature.to); }}>{feature.action}</button> : null}</div>
              </article>;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

export default PremiumOverviewPage;