import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaApple, FaCheck, FaEnvelope, FaGoogle, FaLock } from 'react-icons/fa';

type AuthRole = 'seeker' | 'employer';

const authContent = {
  seeker: {
    eyebrow: 'Welcome back',
    title: 'Pick up your job search where you left off.',
    description: 'Sign in to review matched roles, manage saved jobs, and keep every application moving.',
    metrics: [
      { value: '92%', label: 'profile match accuracy' },
      { value: '48h', label: 'average employer reply window' },
    ],
    highlights: ['Personalized job matches', 'Saved roles across devices', 'Application tracking'],
    headingLabel: 'Sign in',
    heading: 'Access your account',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    submitLabel: 'Sign in',
    forgotPath: '/login',
    switchText: 'New to LearnJobs?',
    switchLink: 'Create an account',
    switchPath: '/register',
    dashboardPath: '/seeker/dashboard',
  },
  employer: {
    eyebrow: 'Employer access',
    title: 'Manage job posts and candidate conversations in one place.',
    description: 'Sign in to publish roles, review applicants, and keep hiring work organized.',
    metrics: [
      { value: '18k+', label: 'companies hiring' },
      { value: '2.4M', label: 'candidate profiles' },
    ],
    highlights: ['Post and edit open roles', 'Track qualified applicants', 'Message candidates directly'],
    headingLabel: 'Employer sign in',
    heading: 'Access hiring workspace',
    emailLabel: 'Work email',
    emailPlaceholder: 'hiring@company.com',
    submitLabel: 'Sign in to hiring',
    forgotPath: '/employers/login',
    switchText: 'Hiring on LearnJobs?',
    switchLink: 'Create employer account',
    switchPath: '/employers/register',
    dashboardPath: '/employer/dashboard',
  },
};

type SignInPageProps = {
  role?: AuthRole;
};

function SignInPage({ role = 'seeker' }: SignInPageProps) {
  const navigate = useNavigate();
  const content = authContent[role];

  return (
    <section className="auth-page" aria-labelledby="signin-title">
      <div className="auth-shell">
        <aside className="auth-panel auth-panel--brand" aria-label="Account benefits">
          <div className="auth-brand-card">
            <span className="auth-brand-card__eyebrow">{content.eyebrow}</span>
            <h1 id="signin-title">{content.title}</h1>
            <p>{content.description}</p>
            <div className="auth-metrics" aria-label="LearnJobs platform metrics">
              {content.metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-benefits">
            {content.highlights.map((item) => (
              <span key={item}>
                <FaCheck />
                {item}
              </span>
            ))}
          </div>
        </aside>

        <div className="auth-panel auth-panel--form">
          <div className="auth-form-heading">
            <span>{content.headingLabel}</span>
            <h2>{content.heading}</h2>
          </div>

          <div className="auth-social-grid">
            <button type="button" className="auth-social-button">
              <FaGoogle />
              Google
            </button>
            <button type="button" className="auth-social-button">
              <FaApple />
              Apple
            </button>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(content.dashboardPath);
            }}
          >
            <label className="auth-field">
              <span>{content.emailLabel}</span>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <Input type="email" placeholder={content.emailPlaceholder} autoComplete="email" />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input type="password" placeholder="Enter your password" autoComplete="current-password" />
              </div>
            </label>

            <div className="auth-form-options">
              <label className="auth-check">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to={content.forgotPath}>Forgot password?</Link>
            </div>

            <Button type="submit" variant="primary" fullWidth className="auth-submit">
              {content.submitLabel}
            </Button>
          </form>

          <p className="auth-switch">
            {content.switchText} <Link to={content.switchPath}>{content.switchLink}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default SignInPage;
