import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AccountRoleMismatchError, EmailVerificationRequiredError, useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { getUserFacingError } from '../../utils/userFacingError';
import GoogleGMark from '../../components/common/GoogleGMark';
import { FaCheck, FaEnvelope, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

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
    forgotPath: '/forgot-password',
    switchText: 'New to LeamJobs?',
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
    forgotPath: '/forgot-password',
    switchText: 'Hiring on LeamJobs?',
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isLoading: isAuthLoading } = useAuth();
  const content = authContent[role];
  const expectedRole = role === 'employer' ? 'EMPLOYER' : 'SEEKER';
  const roleLabels = { SEEKER: 'Seeker', EMPLOYER: 'Employer' } as const;
  const roleDescriptions = { SEEKER: 'a Seeker', EMPLOYER: 'an Employer' } as const;
  const signInPaths = { SEEKER: '/login', EMPLOYER: '/employers/login' } as const;
  const queryRole = searchParams.get('existing_role');
  const googleAccountRole = queryRole === 'SEEKER' || queryRole === 'EMPLOYER' ? queryRole : null;
  const oauthError = searchParams.get('oauth_error');
  const googleRoleMismatch = oauthError === 'role_mismatch' ? googleAccountRole : null;
  const googleAccountExists = oauthError === 'account_exists' ? googleAccountRole : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [manualRoleMismatch, setManualRoleMismatch] = useState<'SEEKER' | 'EMPLOYER' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const manualRoleConflictRole = manualRoleMismatch && manualRoleMismatch !== expectedRole ? manualRoleMismatch : null;
  const googleRoleConflictRole = googleRoleMismatch && googleRoleMismatch !== expectedRole ? googleRoleMismatch : null;
  const crossRoleConflictRole = manualRoleConflictRole ?? googleRoleConflictRole;

  const handleGoogleSignIn = () => {
    setError('');
    setIsStartingGoogleSignIn(true);

    const targetRole = role === 'employer' ? 'EMPLOYER' : 'SEEKER';
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? API_BASE_URL).replace(/\/$/, '');
    const query = new URLSearchParams({ role: targetRole });
    window.location.assign(`${apiBaseUrl}/auth/google/start?${query.toString()}`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(email, password, role === 'employer' ? 'EMPLOYER' : 'SEEKER');

      if (!user.role) {
        setError('Your account could not be loaded. Please try again.');
        return;
      }

      const actualRole = user.role;

      const destinationMap = {
        SEEKER: '/seeker/dashboard',
        EMPLOYER: '/employer/jobs',
        ADMIN: '/admin/moderation',
      } as const;

      if (actualRole === 'ADMIN') {
        navigate('/admin/moderation', { replace: true });
        return;
      }

      if (expectedRole !== actualRole) {
        navigate(destinationMap[actualRole] ?? '/', { replace: true });
        return;
      }

      const from = (location.state as { from?: Location } | null)?.from;
      navigate(from && from.pathname ? from.pathname : destinationMap[actualRole], { replace: true });
    } catch (loginError) {
      if (loginError instanceof AccountRoleMismatchError) {
        setManualRoleMismatch(loginError.accountRole);
        setError('');
        return;
      }
      if (loginError instanceof EmailVerificationRequiredError) {
        const verificationPath = role === 'employer' ? '/employers/verify-email' : '/verify-email';
        navigate(`${verificationPath}?email=${encodeURIComponent(email.trim())}`, {
          replace: true,
          state: { email: email.trim(), verificationRequired: true },
        });
        return;
      }
      setError(getUserFacingError(loginError, 'auth').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="signin-title">
      <div className="auth-shell">
        <aside className="auth-panel auth-panel--brand" aria-label="Account benefits">
          <div className="auth-brand-card">
            <span className="auth-brand-card__eyebrow">{content.eyebrow}</span>
            <h1 id="signin-title">{content.title}</h1>
            <p>{content.description}</p>
            <div className="auth-metrics" aria-label="LeamJobs platform metrics">
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

          {crossRoleConflictRole ? (
            <div className="auth-account-conflict" role="status" aria-live="polite">
              <div>
                <strong>This account is registered as {roleDescriptions[crossRoleConflictRole]}.</strong>
                <p>Continue on the matching sign-in page to access your account.</p>
                <Link className="auth-account-conflict__action" to={signInPaths[crossRoleConflictRole]}>
                  Continue to {roleLabels[crossRoleConflictRole]} Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {googleRoleMismatch ? (
                <p className="auth-feedback auth-feedback--notice" role="status">
                  This Google account is registered as {roleDescriptions[googleRoleMismatch]}. Sign in here to continue with that account.
                </p>
              ) : null}
              {googleAccountExists ? (
                <p className="auth-feedback auth-feedback--notice" role="status">
                  This email is already registered as {roleDescriptions[googleAccountExists]} account. Sign in using your existing account details.
                </p>
              ) : null}
              {!googleAccountExists ? <button
                type="button"
                className="auth-social-button"
                onClick={handleGoogleSignIn}
                disabled={isStartingGoogleSignIn || isSubmitting || isAuthLoading}
              >
                <GoogleGMark />
                {isStartingGoogleSignIn ? 'Connecting to Google...' : 'Continue with Google'}
              </button> : null}

              {!googleAccountExists ? (
                <div className="auth-divider">
                  <span>or continue with email</span>
                </div>
              ) : null}

              {error ? <p role="alert">{error}</p> : null}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>{content.emailLabel}</span>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <Input
                  type="email"
                  placeholder={content.emailPlaceholder}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting || isAuthLoading}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting || isAuthLoading}
                  className="auth-password-input"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting || isAuthLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            <div className="auth-form-options">
              <label className="auth-check">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to={content.forgotPath}>Forgot password?</Link>
            </div>

            <Button type="submit" variant="primary" fullWidth className="auth-submit" disabled={isSubmitting || isAuthLoading}>
              {isSubmitting ? 'Signing in...' : content.submitLabel}
            </Button>
              </form>

              <p className="auth-switch">
                {content.switchText} <Link to={content.switchPath}>{content.switchLink}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default SignInPage;
