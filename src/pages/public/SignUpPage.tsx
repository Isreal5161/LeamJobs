import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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

function SignUpPage({ role = 'seeker' }: SignUpPageProps) {
  const navigate = useNavigate();
  const content = authContent[role];

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

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(content.dashboardPath);
            }}
          >
            <label className="auth-field">
              <span>{content.nameLabel}</span>
              <div className="auth-input-wrap">
                <FaUser />
                <Input type="text" placeholder={content.namePlaceholder} autoComplete="name" />
              </div>
            </label>

            <label className="auth-field">
              <span>{content.emailLabel}</span>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <Input type="email" placeholder={content.emailPlaceholder} autoComplete="email" />
              </div>
            </label>

            {content.companyLabel ? (
              <label className="auth-field">
                <span>{content.companyLabel}</span>
                <div className="auth-input-wrap">
                  <FaBuilding />
                  <Input type="text" placeholder="Company Ltd" autoComplete="organization" />
                </div>
              </label>
            ) : null}

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input type="password" placeholder="Create a password" autoComplete="new-password" />
              </div>
            </label>

            <label className="auth-check auth-check--terms">
              <input type="checkbox" />
              <span>{content.terms}</span>
            </label>

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

export default SignUpPage;
