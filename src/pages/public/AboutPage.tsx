import Button from '../../components/common/Button';
import {
  FaBriefcase,
  FaBuilding,
  FaFlag,
  FaGlobe,
  FaHeart,
  FaRocket,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import { useSiteContent } from '../../context/SiteContentContext';

function AboutIllustration() {
  return (
    <div className="about-illustration" aria-hidden="true">
      <div className="about-illustration__card about-illustration__card--profile">
        <span />
        <i />
        <i />
      </div>
      <div className="about-illustration__card about-illustration__card--chart">
        <span />
        <i />
        <i />
        <i />
      </div>
      <div className="about-illustration__check">✓</div>
      <div className="about-illustration__people">
        <div className="about-person about-person--one">
          <span className="about-person__hair" />
          <span className="about-person__face" />
          <span className="about-person__body" />
        </div>
        <div className="about-person about-person--two">
          <span className="about-person__hair" />
          <span className="about-person__face" />
          <span className="about-person__body" />
        </div>
        <div className="about-person about-person--three">
          <span className="about-person__hair" />
          <span className="about-person__face" />
          <span className="about-person__body" />
        </div>
        <div className="about-person about-person--four">
          <span className="about-person__hair" />
          <span className="about-person__face" />
          <span className="about-person__body" />
        </div>
        <div className="about-illustration__laptop" />
        <div className="about-illustration__desk" />
      </div>
      <div className="about-illustration__plant">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function AboutPage() {
  const { content } = useSiteContent();
  const { eyebrow, title, description, primaryCta, secondaryCta, values, stats, team } = content.about;

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <p className="about-page__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="about-hero__actions">
            <Button variant="primary">{primaryCta}</Button>
            <Button variant="outline">{secondaryCta}</Button>
          </div>
        </div>
        <AboutIllustration />
      </section>

      <section className="about-intro-grid" aria-label="Mission and values">
        <article className="about-card about-mission-card">
          <div className="about-icon about-icon--large">
            <FaFlag />
          </div>
          <div>
            <h2>Our mission</h2>
            <p>
              To create a smarter, more human way to find and fill jobs, empowering people to grow
              their careers and companies to build exceptional teams.
            </p>
          </div>
        </article>

        <article className="about-card about-values-card">
          <h2>Our values</h2>
          <div className="about-values-grid">
            {values.map((value, index) => (
              <div className="about-value" key={value.title}>
                <div className="about-icon">{index === 0 ? <FaUsers /> : index === 1 ? <FaShieldAlt /> : index === 2 ? <FaRocket /> : <FaHeart />}</div>
                <div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="about-stats" aria-label="LeamJobs by the numbers">
        {stats.map((stat, index) => (
          <article className="about-stat-card" key={stat.label}>
            <span>{index === 0 ? <FaBriefcase /> : index === 1 ? <FaBuilding /> : index === 2 ? <FaUsers /> : <FaGlobe />}</span>
            <strong>{stat.value}</strong>
            <p>{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="about-bottom-card">
        <article className="about-team-copy">
          <h2>Built by a passionate team</h2>
          <p>
            LeamJobs is crafted by a global team of builders, designers, and problem-solvers who
            care deeply about making the job search experience better for everyone.
          </p>
          <Button variant="outline">Join our team</Button>
        </article>
        <div className="about-team-avatars" aria-label="Team members">
          {team.map((member, index) => (
            <span className={`about-avatar about-avatar--${index + 1}`} key={member}>
              {member}
            </span>
          ))}
          <span className="about-avatar about-avatar--more">+12</span>
        </div>
        <article className="about-partner-copy">
          <h2>Stronger together</h2>
          <p>
            We partner with amazing companies and communities to create more opportunities and drive
            meaningful careers forward.
          </p>
          <Button variant="outline">Partner with us</Button>
        </article>
      </section>
    </div>
  );
}

export default AboutPage;
