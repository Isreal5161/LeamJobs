import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import RecommendedJobs from '../../components/jobs/RecommendedJobs';
import { FaBriefcase, FaBuilding, FaUsers, FaWifi, FaClock, FaPencilAlt, FaMapMarkerAlt, FaDollarSign, FaCode, FaBullhorn } from 'react-icons/fa';


function WelcomePage() {
  return (
    <main>
      <section className="hero hero--welcome">
        <div className="container hero__panel">
          <div className="hero__top-row">
            <div className="hero__text-panel">
              <h1 className="hero__title">Find a job that<br/>actually fits you.</h1>
              <p className="hero__subtitle">
                Smart matching, better opportunities, and tools to help you grow your career.
              </p>
              {/* CTA buttons moved to bottom row for horizontal alignment with search */}
            </div>

            <div className="hero__stats">
              {[
                { icon: <FaBriefcase />, value: '120k+', label: 'Open roles' },
                { icon: <FaBuilding />, value: '18k+', label: 'Companies' },
                { icon: <FaUsers />, value: '2.4M', label: 'Hired members' },
              ].map((stat) => (
                <div key={stat.label} className="hero__stat-card">
                  <span className="hero__stat-icon">{stat.icon}</span>
                  <div>
                    <p>{stat.value}</p>
                    <span>{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero__bottom">
            <div className="hero-actions">
              <Button variant="primary">Create free account</Button>
              <Button variant="outline">I already have one</Button>
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
              {[
                { icon: <FaWifi />, label: 'Remote' },
                { icon: <FaClock />, label: 'Full-time' },
                { icon: <FaPencilAlt />, label: 'Design' },
                { icon: <FaMapMarkerAlt />, label: 'New York' },
                { icon: <FaDollarSign />, label: '$100k+' },
                { icon: <FaCode />, label: 'Engineering' },
                { icon: <FaBullhorn />, label: 'Marketing' },
              ].map((f) => (
                <button key={f.label} className="tag-list__item filter-item" type="button">
                  <span className="filter-icon">{f.icon}</span>
                  <span className="filter-label">{f.label}</span>
                </button>
              ))}
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
