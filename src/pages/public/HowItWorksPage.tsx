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
import { useSiteContent } from '../../context/SiteContentContext';

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

function HeroSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <div className="how-hero__steps" aria-label="Three step overview">
      {steps.map((step, index) => (
        <div className="how-hero-step" key={step.title}>
          <div className="how-hero-step__number">{index + 1}</div>
          <p>{index === 0 ? 'Create profile' : index === 1 ? 'Get matched' : 'Apply & get hired'}</p>
          <StepIllustration variant={index === 0 ? 'profile' : index === 1 ? 'match' : 'apply'} />
        </div>
      ))}
    </div>
  );
}

function HowItWorksPage() {
  const { content } = useSiteContent();
  const { heroTitle, heroSubtitle, primaryCta, secondaryCta, steps, stats, ctaTitle, ctaSubtitle, ctaButton } = content['how-it-works'];

  return (
    <div className="how-page">
      <section className="how-hero">
        <div className="how-hero__content">
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <div className="how-hero__actions">
            <Button variant="primary">{primaryCta}</Button>
            <Button variant="outline">{secondaryCta}</Button>
          </div>
        </div>
        <HeroSteps steps={steps} />
      </section>

      <section className="how-steps" aria-label="How LeamJobs works">
        {steps.map((step, index) => (
          <article className="how-step-card" key={step.title}>
            <div className="how-step-card__number">{index + 1}</div>
            <div className="how-step-card__copy">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
            <StepIllustration variant={index === 0 ? 'profile' : index === 1 ? 'match' : 'apply'} />
          </article>
        ))}
      </section>

      <section className="how-stats" aria-label="LeamJobs results">
        {stats.map((stat, index) => (
          <article className="how-stat" key={stat.label}>
            <span>{index === 0 ? <FaBriefcase /> : index === 1 ? <FaBuilding /> : index === 2 ? <FaUsers /> : <FaGlobe />}</span>
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
          <h2>{ctaTitle}</h2>
          <p>{ctaSubtitle}</p>
        </div>
        <Button variant="primary">{ctaButton}</Button>
      </section>
    </div>
  );
}

export default HowItWorksPage;
