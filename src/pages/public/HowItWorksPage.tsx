import Button from '../../components/common/Button';
import {
  FaBriefcase,
  FaBuilding,
  FaCheck,
  FaGlobe,
  FaLaptop,
  FaRegEnvelope,
  FaRocket,
  FaStar,
  FaUsers,
} from 'react-icons/fa';

const steps = [
  {
    number: '1',
    title: 'Create your profile',
    text: "Tell us about your skills, experience, and what you're looking for. Our AI builds a smart profile in minutes.",
    variant: 'profile',
  },
  {
    number: '2',
    title: 'Get matched instantly',
    text: 'Receive personalized job recommendations with a match score so you only see roles that truly fit.',
    variant: 'match',
  },
  {
    number: '3',
    title: 'Apply and get hired',
    text: 'Apply in one tap, track every application, and connect directly with hiring teams.',
    variant: 'apply',
  },
];

const stats = [
  { icon: <FaBriefcase />, value: '120k+', label: 'Open roles' },
  { icon: <FaBuilding />, value: '18k+', label: 'Companies' },
  { icon: <FaUsers />, value: '2.4M', label: 'Hired members' },
  { icon: <FaGlobe />, value: '150+', label: 'Countries' },
];

function StepIllustration({ variant }: { variant: string }) {
  return (
    <div className={`how-illustration how-illustration--${variant}`} aria-hidden="true">
      <div className="how-person">
        <span className="how-person__hair" />
        <span className="how-person__face" />
        <span className="how-person__body" />
      </div>
      <div className="how-device">
        {variant === 'profile' && (
          <>
            <span className="how-device__avatar" />
            <i />
            <i />
            <b><FaCheck /></b>
            <b><FaCheck /></b>
          </>
        )}
        {variant === 'match' && (
          <>
            <span>Match score</span>
            <strong>92%</strong>
            <small><FaBriefcase /> 95% match</small>
          </>
        )}
        {variant === 'apply' && (
          <>
            <span>Application sent!</span>
            <strong><FaCheck /></strong>
            <i />
            <i />
          </>
        )}
      </div>
      {variant === 'profile' && <FaLaptop className="how-illustration__laptop" />}
      {variant === 'match' && <FaStar className="how-illustration__accent" />}
      {variant === 'apply' && <FaRegEnvelope className="how-illustration__mail" />}
    </div>
  );
}

function HeroSteps() {
  return (
    <div className="how-hero__steps" aria-label="Three step overview">
      {steps.map((step, index) => (
        <div className="how-hero-step" key={step.title}>
          <div className="how-hero-step__number">{step.number}</div>
          <p>{index === 0 ? 'Create profile' : index === 1 ? 'Get matched' : 'Apply & get hired'}</p>
          <StepIllustration variant={step.variant} />
        </div>
      ))}
    </div>
  );
}

function HowItWorksPage() {
  return (
    <div className="how-page">
      <section className="how-hero">
        <div className="how-hero__content">
          <h1>How LeamJobs works</h1>
          <p>Three simple steps to your next great opportunity.</p>
          <div className="how-hero__actions">
            <Button variant="primary">Create free account</Button>
            <Button variant="outline">I already have one</Button>
          </div>
        </div>
        <HeroSteps />
      </section>

      <section className="how-steps" aria-label="How LeamJobs works">
        {steps.map((step) => (
          <article className="how-step-card" key={step.title}>
            <div className="how-step-card__number">{step.number}</div>
            <div className="how-step-card__copy">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
            <StepIllustration variant={step.variant} />
          </article>
        ))}
      </section>

      <section className="how-stats" aria-label="LeamJobs results">
        {stats.map((stat) => (
          <article className="how-stat" key={stat.label}>
            <span>{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="how-cta">
        <div className="how-cta__icon">
          <FaRocket />
        </div>
        <div>
          <h2>Ready to find your next role?</h2>
          <p>Join millions of professionals using LeamJobs.</p>
        </div>
        <Button variant="primary">Create free account</Button>
      </section>
    </div>
  );
}

export default HowItWorksPage;
