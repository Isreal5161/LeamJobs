import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import RecommendedJobs from '../../components/jobs/RecommendedJobs';
import { FaArrowRight, FaBriefcase, FaBuilding, FaUsers, FaWifi, FaClock, FaPencilAlt, FaMapMarkerAlt, FaDollarSign, FaCode, FaBullhorn } from 'react-icons/fa';
import { useSiteContent } from '../../context/SiteContentContext';


function WelcomePage() {
  const { content } = useSiteContent();
  const { heroTitle, heroSubtitle, primaryCta, secondaryCta, employerCta, stats, filters } = content.welcome;

  return (
    <main>
      <section className="hero hero--welcome">
        <div className="container hero__panel">
          <div className="hero__top-row">
            <div className="hero__text-panel">
              <h1 className="hero__title">{heroTitle}</h1>
              <p className="hero__subtitle">{heroSubtitle}</p>
              {/* CTA buttons moved to bottom row for horizontal alignment with search */}
            </div>

            <div className="hero__stats">
              {stats.map((stat, index) => (
                <div key={stat.label} className="hero__stat-card">
                  <span className="hero__stat-icon">{index === 0 ? <FaBriefcase /> : index === 1 ? <FaBuilding /> : <FaUsers />}</span>
                  <div>
                    <p>{stat.value}</p>
                    <span>{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero__bottom">
            <div className="hero-actions" aria-label="Account actions">
              <div className="hero-actions__seeker">
                <Link className="button button--primary hero-actions__primary" to="/register">
                  {primaryCta}
                </Link>
                <Link className="hero-actions__secondary" to="/login">
                  {secondaryCta}
                </Link>
              </div>
              <Link className="hero-actions__employer" to="/employers/register">
                <span>Hiring?</span>
                {employerCta}
                <FaArrowRight />
              </Link>
            </div>

            <div className="hero__search-panel card">
              <div className="hero__search-grid">
                <div className="search-card__field">
                  <Input type="search" placeholder="Job title or keyword" />
                </div>
                <div className="search-card__field">
                  <Input type="text" placeholder="City, state, or remote" />
                </div>
                <Button variant="primary" className="hero__search-button">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-section">
        <div className="container jobs-section__content">
          <aside className="jobs-filters">
            <h4>Filters</h4>
            <div className="filters-list">
              {filters.map((label, index) => {
                const icon = index === 0 ? <FaWifi /> : index === 1 ? <FaClock /> : index === 2 ? <FaPencilAlt /> : index === 3 ? <FaMapMarkerAlt /> : index === 4 ? <FaDollarSign /> : index === 5 ? <FaCode /> : <FaBullhorn />;

                return (
                  <button key={label} className="tag-list__item filter-item" type="button">
                    <span className="filter-icon">{icon}</span>
                    <span className="filter-label">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="filters-clear">
              <button className="clear-filters" type="button">Clear all filters</button>
            </div>
          </aside>

          <RecommendedJobs />
        </div>
      </section>
    </main>
  );
}

export default WelcomePage;
