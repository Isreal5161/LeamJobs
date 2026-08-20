import Button from '../../components/common/Button';
import {
  FaAirbnb,
  FaBriefcase,
  FaBuilding,
  FaFigma,
  FaGoogle,
  FaMapMarkerAlt,
  FaRocket,
  FaSlack,
  FaSpotify,
  FaUsers,
  FaGlobe,
} from 'react-icons/fa';
import { SiDropbox, SiNotion, SiStripe } from 'react-icons/si';

const filters = ['All', 'Startup', 'Enterprise', 'Remote-first', 'Fintech', 'Design', 'Product', 'Engineering'];

const companies = [
  {
    icon: <FaGoogle />,
    name: 'Google',
    category: 'Technology',
    location: 'Mountain View, CA',
    employees: '100k+ employees',
    tone: 'google',
  },
  {
    icon: <FaSlack />,
    name: 'Slack',
    category: 'Software',
    location: 'San Francisco, CA',
    employees: '2k-5k employees',
    tone: 'slack',
  },
  {
    icon: <SiDropbox />,
    name: 'Dropbox',
    category: 'Cloud Storage',
    location: 'San Francisco, CA',
    employees: '2k-5k employees',
    tone: 'dropbox',
  },
  {
    icon: <FaFigma />,
    name: 'Figma',
    category: 'Design',
    location: 'San Francisco, CA',
    employees: '1k-2k employees',
    tone: 'figma',
  },
  {
    icon: <FaSpotify />,
    name: 'Spotify',
    category: 'Audio',
    location: 'Stockholm, Sweden',
    employees: '5k+ employees',
    tone: 'spotify',
  },
  {
    icon: <SiStripe />,
    name: 'Stripe',
    category: 'Fintech',
    location: 'Dublin, Ireland',
    employees: '4k+ employees',
    tone: 'stripe',
  },
  {
    icon: <FaAirbnb />,
    name: 'Airbnb',
    category: 'Travel',
    location: 'San Francisco, CA',
    employees: '6k+ employees',
    tone: 'airbnb',
  },
  {
    icon: <SiNotion />,
    name: 'Notion',
    category: 'Productivity',
    location: 'San Francisco, CA',
    employees: '1k+ employees',
    tone: 'notion',
  },
];

const stats = [
  { icon: <FaBriefcase />, value: '120k+', label: 'Open roles' },
  { icon: <FaBuilding />, value: '18k+', label: 'Companies' },
  { icon: <FaUsers />, value: '2.4M', label: 'Hired members' },
  { icon: <FaGlobe />, value: '150+', label: 'Countries' },
];

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
  return (
    <div className="companies-page">
      <section className="companies-hero">
        <div className="companies-hero__content">
          <h1>Companies on LeamJobs</h1>
          <p>Explore teams hiring right now-from early-stage startups to Fortune 500 leaders.</p>
          <div className="companies-hero__actions">
            <Button variant="primary">Create free account</Button>
            <Button variant="outline">I already have one</Button>
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
            <div className={`company-card__logo company-card__logo--${company.tone}`}>{company.icon}</div>
            <div className="company-card__content">
              <h2>{company.name}</h2>
              <span>{company.category}</span>
              <p><FaMapMarkerAlt /> {company.location}</p>
              <p><FaUsers /> {company.employees}</p>
              <a href="/features">View jobs</a>
            </div>
          </article>
        ))}
      </section>

      <section className="companies-stats" aria-label="LeamJobs company network">
        {stats.map((stat) => (
          <article className="companies-stat" key={stat.label}>
            <span>{stat.icon}</span>
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
          <h2>Hiring on LeamJobs?</h2>
          <p>Reach millions of qualified candidates and find your next great hire.</p>
        </div>
        <Button variant="primary">Post a job</Button>
      </section>
    </div>
  );
}

export default CompaniesPage;
