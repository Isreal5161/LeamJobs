import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import RecommendedJobs from '../../components/jobs/RecommendedJobs';
import { FaArrowRight, FaBriefcase, FaBuilding, FaUsers, FaWifi, FaClock, FaPencilAlt, FaMapMarkerAlt, FaDollarSign, FaCode, FaBullhorn } from 'react-icons/fa';
import { useSiteContent } from '../../context/SiteContentContext';
import { getPublicJobs, type SeekerDashboardJob } from '../../services/api';

const mapJob = (job: SeekerDashboardJob) => {
  const companyName = job.company?.name ?? 'Company not provided';
  const requirements = Array.isArray(job.requirements)
    ? job.requirements.filter((item): item is string => typeof item === 'string')
    : job.requirements && typeof job.requirements === 'object'
      ? Object.values(job.requirements).flatMap((item) => typeof item === 'string' ? [item] : Array.isArray(item) ? item.filter((value): value is string => typeof value === 'string') : [])
      : [];
  const salaryHigh = (() => {
    if (job.compensation?.type === 'FREELANCE') return Number(job.compensation.projectAmount || 0);
    if (job.compensation?.type === 'CONTRACT') return Number(job.compensation.amount || 0);
    return Number(job.compensation?.salaryMax ?? job.compensation?.salaryMin ?? 0);
  })();

  return {
    id: job.id,
    company: companyName,
    logoText: companyName.slice(0, 2).toUpperCase() || 'C',
    logoClass: 'brand-logo--neutral',
    role: job.title,
    salary: (() => {
      if (!job.compensation) return 'Compensation not specified';
      if (job.compensation.type === 'FREELANCE') return `${job.compensation.currency} ${job.compensation.projectAmount} project`;
      if (job.compensation.type === 'CONTRACT') return `${job.compensation.currency} ${job.compensation.amount} contract`;
      return `${job.compensation.currency} ${job.compensation.salaryMin ?? 'Not specified'} - ${job.compensation.salaryMax ?? 'Not specified'} / ${job.compensation.salaryPeriod.toLowerCase()}`;
    })(),
    location: job.location,
    workArrangement: job.workArrangement ?? 'Remote',
    workType: job.jobType === 'FREELANCE_PROJECT' ? 'Freelance' : 'Full-time',
    level: job.department ?? 'General',
    description: job.description,
    postedAt: new Date(job.createdAt).getTime(),
    salaryHigh,
    applicants: 0,
    views: 0,
    conversion: '0%',
    expires: job.applicationDeadline ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.applicationDeadline)) : 'No deadline',
    status: 'Approved' as const,
    details: {
      overview: job.description,
      responsibilities: job.responsibilities ?? [],
      requirements,
      skills: job.skills ?? [],
      company: job.company?.description ?? 'Company information is not available.',
    },
  };
};

function WelcomePage() {
  const { content } = useSiteContent();
  const {
    heroTitle,
    heroSubtitle,
    primaryCta,
    secondaryCta,
    employerCta,
    filterTitle,
    keywordPlaceholder,
    locationPlaceholder,
    searchButton,
    stats,
    filters,
  } = content.welcome;
  const [keywordQuery, setKeywordQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [publicJobs, setPublicJobs] = useState<ReturnType<typeof mapJob>[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadJobs = async () => {
      setIsLoadingJobs(true);
      setJobsError('');

      const result = await getPublicJobs({ limit: 25 });

      if (!isActive) return;

      if (!result.ok) {
        setPublicJobs([]);
        setJobsError(result.error.message || 'We could not load jobs right now.');
      } else {
        setPublicJobs(result.data.data.jobs.map(mapJob));
      }

      setIsLoadingJobs(false);
    };

    void loadJobs();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const keyword = keywordQuery.trim().toLowerCase();
    const location = locationQuery.trim().toLowerCase();

    return publicJobs.filter((job) => {
      const searchableText = [
        job.company,
        job.role,
        job.description,
        job.location,
        job.workArrangement,
        job.workType,
        job.level,
        ...job.details.skills,
      ].join(' ').toLowerCase();
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesLocation = !location || job.location.toLowerCase().includes(location);

      if (!matchesKeyword || !matchesLocation) return false;
      if (!activeFilter) return true;
      if (activeFilter === '$100k+') return job.salaryHigh >= 100;
      return searchableText.includes(activeFilter.toLowerCase());
    });
  }, [activeFilter, keywordQuery, locationQuery, publicJobs]);

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
                  <Input
                    type="search"
                    placeholder={keywordPlaceholder}
                    value={keywordQuery}
                    onChange={(event) => setKeywordQuery(event.target.value)}
                    aria-label="Search jobs by title or keyword"
                  />
                </div>
                <div className="search-card__field">
                  <Input
                    type="text"
                    placeholder={locationPlaceholder}
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    aria-label="Search jobs by location"
                  />
                </div>
                <Button variant="primary" className="hero__search-button" type="button">
                  {searchButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-section">
        <div className="container jobs-section__content">
          <aside className="jobs-filters">
            <h4>{filterTitle}</h4>
            <div className="filters-list">
              {filters.map((label, index) => {
                const icon = index === 0 ? <FaWifi /> : index === 1 ? <FaClock /> : index === 2 ? <FaPencilAlt /> : index === 3 ? <FaMapMarkerAlt /> : index === 4 ? <FaDollarSign /> : index === 5 ? <FaCode /> : <FaBullhorn />;

                return (
                  <button
                    key={label}
                    className={`tag-list__item filter-item${activeFilter === label ? ' filter-item--active' : ''}`}
                    type="button"
                    aria-pressed={activeFilter === label}
                    onClick={() => setActiveFilter((current) => current === label ? null : label)}
                  >
                    <span className="filter-icon">{icon}</span>
                    <span className="filter-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {isLoadingJobs ? <p className="recommended-jobs__empty">Loading jobs...</p> : null}
          {!isLoadingJobs && jobsError ? <p className="recommended-jobs__empty">{jobsError}</p> : null}
          {!isLoadingJobs && !jobsError ? <RecommendedJobs jobs={filteredJobs} /> : null}
        </div>
      </section>
    </main>
  );
}

export default WelcomePage;
