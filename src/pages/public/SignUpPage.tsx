import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { request } from '../../services/api';
import { FaBriefcase, FaBuilding, FaCheck, FaEnvelope, FaGoogle, FaLock, FaUser } from 'react-icons/fa';

type AuthRole = 'seeker' | 'employer';

const authContent = {
  seeker: {
    eyebrow: 'Start free',
    title: 'Build a profile employers can understand quickly.',
    description: 'Create one account for job recommendations, saved searches, and application progress.',
    previewTitle: 'Product Designer',
    previewMeta: 'Remote-ready profile 86% complete',
    steps: ['Create your profile', 'Get matched with relevant jobs', 'Apply with confidence'],
    headingLabel: 'Create account',
    heading: 'Join LearnJobs',
    nameLabel: 'Full name',
    namePlaceholder: 'Alex Morgan',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    companyLabel: '',
    terms: 'I agree to receive job alerts and product updates.',
    submitLabel: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchPath: '/login',
    dashboardPath: '/seeker/dashboard',
  },
  employer: {
    eyebrow: 'Post a job',
    title: 'Create an employer account for focused, organized hiring.',
    description: 'Set up your company profile, publish open roles, and manage candidates from one workspace.',
    previewTitle: 'Hiring workspace',
    previewMeta: 'Draft role ready for qualified applicants',
    steps: ['Create company profile', 'Post your first role', 'Review and message applicants'],
    headingLabel: 'Employer account',
    heading: 'Start hiring',
    nameLabel: 'Your name',
    namePlaceholder: 'Dana Okafor',
    emailLabel: 'Work email',
    emailPlaceholder: 'hiring@company.com',
    companyLabel: 'Company name',
    terms: 'I agree to receive applicant updates and hiring product emails.',
    submitLabel: 'Create employer account',
    switchText: 'Already hiring here?',
    switchLink: 'Sign in',
    switchPath: '/employers/login',
    dashboardPath: '/employer/jobs',
  },
};

type SignUpPageProps = {
  role?: AuthRole;
};

type RegistrationForm = {
  fullName: string;
  email: string;
  companyName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

type RegistrationErrors = Record<string, string>;

const roleValues: Record<AuthRole, 'SEEKER' | 'EMPLOYER'> = {
  seeker: 'SEEKER',
  employer: 'EMPLOYER',
};

const getPasswordError = (password: string) => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
  return '';
};

function SignUpPage({ role = 'seeker' }: SignUpPageProps) {
  const navigate = useNavigate();
  const content = authContent[role];
  const [form, setForm] = useState<RegistrationForm>({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const setField = <Field extends keyof RegistrationForm>(field: Field, value: RegistrationForm[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setSuccessMessage('');
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ');
    const nextErrors: RegistrationErrors = {};

    if (!firstName) nextErrors.fullName = 'Enter your first and last name.';
    else if (!lastName) nextErrors.fullName = 'Enter your last name.';
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.';
    const passwordError = getPasswordError(form.password);
    if (passwordError) nextErrors.password = passwordError;
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!form.termsAccepted) nextErrors.terms = 'Accept the terms to create your account.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const body = {
      firstName,
      lastName,
      email: form.email.trim(),
      password: form.password,
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      role: roleValues[role],
    };

    const result = await request<{ id: string }>({
      method: 'POST',
      endpoint: '/auth/register',
      body,
    });

    setIsSubmitting(false);

    if (result.ok) {
      setSuccessMessage('Your account was created successfully. Continue to login to access your account.');
      return;
    }

    if (result.status === 400 && Array.isArray(result.error.details)) {
      const backendErrors = result.error.details as Array<{ field?: string; message?: string }>;
      const fieldErrors = backendErrors.reduce<RegistrationErrors>((current, error) => {
        if (error.field && error.message) {
          const field = error.field === 'firstName' || error.field === 'lastName' ? 'fullName' : error.field;
          current[field] = field === 'fullName' && current[field] ? `${current[field]} ${error.message}` : error.message;
        }
        return current;
      }, {});
      setErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: result.error.message });
    } else if (result.status === 409) {
      setErrors({ email: 'An account with this email already exists.' });
    } else if (result.status === 0) {
      setErrors({ form: 'Unable to connect. Check your internet connection and try again.' });
    } else {
      setErrors({ form: 'We could not create your account. Please try again.' });
    }
  };

  return (
    <section className="auth-page" aria-labelledby="signup-title">
      <div className="auth-shell auth-shell--reverse">
        <aside className="auth-panel auth-panel--brand" aria-label="Account setup preview">
          <div className="auth-brand-card">
            <span className="auth-brand-card__eyebrow">{content.eyebrow}</span>
            <h1 id="signup-title">{content.title}</h1>
            <p>{content.description}</p>
            <div className="auth-profile-preview">
              <span className="auth-profile-preview__icon">
                <FaBriefcase />
              </span>
              <div>
                <strong>{content.previewTitle}</strong>
                <span>{content.previewMeta}</span>
              </div>
            </div>
          </div>

          <div className="auth-benefits">
            {content.steps.map((item) => (
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

          <button type="button" className="auth-social-button auth-social-button--full">
            <FaGoogle />
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or use your email</span>
          </div>

          {errors.form ? <p role="alert">{errors.form}</p> : null}
          {successMessage ? <p role="status">{successMessage}</p> : null}

          <form className="auth-form" onSubmit={submitRegistration} noValidate>
            <label className="auth-field">
              <span>{content.nameLabel}</span>
              <div className="auth-input-wrap">
                <FaUser />
                <Input
                  type="text"
                  name="fullName"
                  placeholder={content.namePlaceholder}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                />
              </div>
              {errors.fullName ? <small role="alert">{errors.fullName}</small> : null}
            </label>

            <label className="auth-field">
              <span>{content.emailLabel}</span>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <Input
                  type="email"
                  name="email"
                  placeholder={content.emailPlaceholder}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email ? <small role="alert">{errors.email}</small> : null}
            </label>

            {content.companyLabel ? (
              <label className="auth-field">
                <span>{content.companyLabel}</span>
                <div className="auth-input-wrap">
                  <FaBuilding />
                  <Input
                    type="text"
                    name="companyName"
                    placeholder="Company Ltd"
                    autoComplete="organization"
                    value={form.companyName}
                    onChange={(event) => setField('companyName', event.target.value)}
                  />
                </div>
              </label>
            ) : null}

            <label className="auth-field">
              <span>Phone (optional)</span>
              <Input
                type="tel"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
              </div>
              {errors.password ? <small role="alert">{errors.password}</small> : null}
            </label>

            <label className="auth-field">
              <span>Confirm password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField('confirmPassword', event.target.value)}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
              </div>
              {errors.confirmPassword ? <small role="alert">{errors.confirmPassword}</small> : null}
            </label>

            <label className="auth-check auth-check--terms">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={form.termsAccepted}
                onChange={(event) => setField('termsAccepted', event.target.checked)}
                aria-invalid={Boolean(errors.terms)}
              />
              <span>{content.terms}</span>
            </label>
            {errors.terms ? <small role="alert">{errors.terms}</small> : null}

            <Button type="submit" variant="primary" fullWidth className="auth-submit" disabled={isSubmitting || Boolean(successMessage)}>
              {isSubmitting ? 'Creating account...' : content.submitLabel}
            </Button>
            {successMessage ? (
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate(content.switchPath)}>
                Continue to login
              </Button>
            ) : null}
          </form>

          <p className="auth-switch">
            {content.switchText} <Link to={content.switchPath}>{content.switchLink}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default SignUpPage;
