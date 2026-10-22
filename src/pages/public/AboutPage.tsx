import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const teamImages = Array.isArray(content.about.teamImages) ? content.about.teamImages : [];
  const partnerUrl = typeof content.about.partnerUrl === 'string' && content.about.partnerUrl
    ? content.about.partnerUrl
    : '/companies';
  const isInternalPartnerUrl = partnerUrl.startsWith('/') && !partnerUrl.startsWith('//') && !partnerUrl.includes('\\');
  let safeExternalPartnerUrl = '';
  if (!isInternalPartnerUrl) {
    try {
      const url = new URL(partnerUrl);
      if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) safeExternalPartnerUrl = url.toString();
    } catch {
      safeExternalPartnerUrl = '';
    }
  }

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <p className="about-page__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="about-hero__actions">
            <Link className="button button--primary" to="/register">{primaryCta}</Link>
            <Link className="button button--outline" to="/login">{secondaryCta}</Link>
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
          <h2>{content.about.teamTitle}</h2>
          <p>{content.about.teamText}</p>
          <Link className="button button--outline" to="/register">{content.about.teamButton}</Link>
        </article>
        <div className="about-team-avatars" aria-label="Team members">
          {team.map((member, index) => (
            <TeamAvatar key={`${member}-${index}-${teamImages[index] ?? ''}`} member={member} index={index} imageUrl={teamImages[index]} />
          ))}
          <span className="about-avatar about-avatar--more">{content.about.teamMoreLabel}</span>
        </div>
        <article className="about-partner-copy">
          <h2>{content.about.partnerTitle}</h2>
          <p>{content.about.partnerText}</p>
          {isInternalPartnerUrl ? (
            <Link className="button button--outline" to={partnerUrl}>{content.about.partnerButton}</Link>
          ) : safeExternalPartnerUrl ? (
            <a className="button button--outline" href={safeExternalPartnerUrl} target="_blank" rel="noopener noreferrer">{content.about.partnerButton}</a>
          ) : (
            <Link className="button button--outline" to="/companies">{content.about.partnerButton}</Link>
          )}
        </article>
      </section>
    </div>
  );
}

function TeamAvatar({ member, index, imageUrl }: { member: string; index: number; imageUrl?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <span className={`about-avatar about-avatar--${index + 1}`}>
      {member}
      {imageUrl && !imageFailed ? <img src={imageUrl} alt={`Team member ${member}`} onError={() => setImageFailed(true)} /> : null}
    </span>
  );
}

export default AboutPage;
