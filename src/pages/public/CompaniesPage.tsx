import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  FaAirbnb,
  FaAmazon,
  FaBriefcase,
  FaBuilding,
  FaFigma,
  FaGoogle,
  FaMapMarkerAlt,
  FaMicrosoft,
  FaRocket,
  FaSlack,
  FaSpotify,
  FaUsers,
  FaGlobe,
} from 'react-icons/fa';
import { SiDropbox, SiNotion, SiStripe } from 'react-icons/si';
import { useSiteContent } from '../../context/SiteContentContext';

function CompaniesHeroArt() {
  return (
    <div className="companies-hero-art" aria-hidden="true">
      <div className="companies-skyline">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="companies-trees">
        <span />
        <span />
        <span />
      </div>
      <div className="companies-logo-bubble companies-logo-bubble--google"><FaGoogle /></div>
      <div className="companies-logo-bubble companies-logo-bubble--slack"><FaSlack /></div>
      <div className="companies-logo-bubble companies-logo-bubble--dropbox"><SiDropbox /></div>
      <div className="companies-logo-bubble companies-logo-bubble--figma"><FaFigma /></div>
      <div className="companies-logo-bubble companies-logo-bubble--spotify"><FaSpotify /></div>
    </div>
  );
}

function CompaniesPage() {
  const { content } = useSiteContent();
  const { heroTitle, heroSubtitle, primaryCta, secondaryCta, filters, companies, stats, ctaTitle, ctaSubtitle, ctaButton } = content.companies;

  return (
    <div className="companies-page">
      <section className="companies-hero">
        <div className="companies-hero__content">
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <div className="companies-hero__actions">
            <Button variant="primary">{primaryCta}</Button>
            <Button variant="outline">{secondaryCta}</Button>
          </div>
        </div>
        <CompaniesHeroArt />
      </section>

      <nav className="companies-filters" aria-label="Company categories">
        {filters.map((filter) => (
          <button
            className={`companies-filter ${filter === 'All' ? 'companies-filter--active' : ''}`}
            type="button"
            key={filter}
          >
            {filter}
          </button>
        ))}
      </nav>

      <section className="companies-grid" aria-label="Companies hiring on LeamJobs">
        {companies.map((company) => (
          <article className="company-card" key={company.name}>
            <div className={`company-card__logo company-card__logo--${company.tone}`}>
              {company.tone === 'google' ? <FaGoogle /> : company.tone === 'slack' ? <FaSlack /> : company.tone === 'dropbox' ? <SiDropbox /> : company.tone === 'figma' ? <FaFigma /> : company.tone === 'spotify' ? <FaSpotify /> : company.tone === 'stripe' ? <SiStripe /> : company.tone === 'airbnb' ? <FaAirbnb /> : company.tone === 'amazon' ? <FaAmazon /> : company.tone === 'microsoft' ? <FaMicrosoft /> : <SiNotion />}
            </div>
            <div className="company-card__content">
              <h2>{company.name}</h2>
              <span>{company.category}</span>
              <p><FaMapMarkerAlt /> {company.location}</p>
              <p><FaUsers /> {company.employees}</p>
              <Link to={`/jobs/${company.name.toLowerCase()}`}>View jobs</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="companies-stats" aria-label="LeamJobs company network">
        {stats.map((stat, index) => (
          <article className="companies-stat" key={stat.label}>
            <span>{index === 0 ? <FaBriefcase /> : index === 1 ? <FaBuilding /> : index === 2 ? <FaUsers /> : <FaGlobe />}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="companies-cta">
        <div className="companies-cta__icon">
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

export default CompaniesPage;
