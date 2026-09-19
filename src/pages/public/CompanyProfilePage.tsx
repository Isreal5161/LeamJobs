import { useEffect, useState } from 'react';
import { FaArrowLeft, FaBuilding, FaCheckCircle, FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CompanyLogo from '../../components/jobs/CompanyLogo';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { getPublicCompany, type PublicCompanyResponse } from '../../services/api';

const PAGE_SIZE = 12;

type CompanyData = PublicCompanyResponse['data'];

type ExternalLinkProps = {
  href: string | null;
  label: string;
};

const safeExternalUrl = (value: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

function ExternalCompanyLink({ href, label }: ExternalLinkProps) {
  const safeUrl = safeExternalUrl(href);
  if (!safeUrl) return null;

  return (
    <a className="public-company-profile__external-link" href={safeUrl} target="_blank" rel="noreferrer" aria-label={`${label} for company`}>
      {label}
      <FaExternalLinkAlt aria-hidden="true" />
    </a>
  );
}

function CompanyProfileSkeleton() {
  return (
    <main className="public-company-profile public-company-profile--loading" role="status" aria-live="polite" aria-label="Loading company profile" aria-busy="true">
      <div className="public-company-profile__hero public-company-profile__skeleton-hero">
        <span className="public-company-profile__skeleton public-company-profile__skeleton--logo" />
        <div>
          <span className="public-company-profile__skeleton public-company-profile__skeleton--title" />
          <span className="public-company-profile__skeleton public-company-profile__skeleton--line" />
        </div>
      </div>
      <section className="public-company-profile__skeleton-grid">
        <span className="public-company-profile__skeleton public-company-profile__skeleton--panel" />
        <span className="public-company-profile__skeleton public-company-profile__skeleton--panel" />
        <span className="public-company-profile__skeleton public-company-profile__skeleton--panel" />
      </section>
    </main>
  );
}

function CompanyProfilePage() {
  const { employerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<CompanyData | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadCompany = async () => {
      if (!employerId) {
        setError('Company not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      const result = await getPublicCompany(employerId, page, PAGE_SIZE);
      if (!isActive) return;

      if (result.ok) {
        setData(result.data.data);
      } else {
        setData(null);
        setError(result.status === 404 ? 'Company not found' : result.error.message);
      }
      setIsLoading(false);
    };

    void loadCompany();
    return () => {
      isActive = false;
    };
  }, [employerId, page]);

  const fromJob = Boolean((location.state as { fromJob?: boolean } | null)?.fromJob);
  const backLabel = fromJob ? 'Back to job' : 'Back to companies';
  const handleBack = () => {
    if (fromJob) {
      navigate(-1);
      return;
    }
    navigate('/companies');
  };

  if (isLoading) return <CompanyProfileSkeleton />;

  if (!data) {
    return (
      <main className="public-company-profile public-company-profile--state">
        <button className="public-company-profile__back" type="button" onClick={handleBack}>
          <FaArrowLeft aria-hidden="true" />
          {backLabel}
        </button>
        <section className="public-company-profile__empty" role="alert">
          <h1>{error || 'Company not found'}</h1>
          <p>We could not find a public profile for this company.</p>
          <Link className="button button--primary" to="/">Browse jobs</Link>
        </section>
      </main>
    );
  }

  const { company, statistics, jobs, pagination } = data;
  const locationText = [company.location, company.state, company.country].filter(Boolean).join(', ');
  const companyDetails = [
    ['Industry', company.industry],
    ['Company size', company.companySize],
    ['Location', company.location],
    ['Address', company.address],
    ['State', company.state],
    ['Country', company.country],
  ].filter(([, value]) => value);
  const totalJobs = pagination.total;

  return (
    <main className="public-company-profile">
      <button className="public-company-profile__back" type="button" onClick={handleBack}>
        <FaArrowLeft aria-hidden="true" />
        {backLabel}
      </button>

      <section className="public-company-profile__hero" aria-labelledby="company-profile-title">
        <CompanyLogo company={company.name} logoUrl={company.logoUrl} logoText={company.name.slice(0, 2).toUpperCase()} logoClass="public-company-profile__logo" />
        <div className="public-company-profile__hero-content">
          <div className="public-company-profile__title-row">
            <h1 id="company-profile-title">{company.name}</h1>
            {company.verified ? <span className="public-company-profile__verified"><FaCheckCircle aria-hidden="true" /> Verified</span> : null}
          </div>
          <div className="public-company-profile__meta">
            {company.industry ? <span>{company.industry}</span> : null}
            {company.companySize ? <span><FaBuilding aria-hidden="true" /> {company.companySize}</span> : null}
            {locationText ? <span><FaMapMarkerAlt aria-hidden="true" /> {locationText}</span> : null}
          </div>
          {company.description ? <p>{company.description}</p> : <p>This company has not added a public description yet.</p>}
          <div className="public-company-profile__links">
            <ExternalCompanyLink href={company.website} label="Website" />
            <ExternalCompanyLink href={company.linkedinUrl} label="LinkedIn" />
            <ExternalCompanyLink href={company.twitterUrl} label="X / Twitter" />
            <ExternalCompanyLink href={company.facebookUrl} label="Facebook" />
          </div>
        </div>
      </section>

      <section className="public-company-profile__stats" aria-label="Company statistics">
        <div><strong>{statistics.jobsPosted}</strong><span>Jobs posted</span></div>
        <div><strong>{statistics.applicants}</strong><span>Applicants</span></div>
        <div><strong>{statistics.candidatesSelected}</strong><span>Candidates selected</span></div>
      </section>

      <div className="public-company-profile__content">
        <div className="public-company-profile__main-column">
          <section className="public-company-profile__section">
            <h2>About {company.name}</h2>
            <p>{company.description || 'This company has not added a public description yet.'}</p>
          </section>

          <section className="public-company-profile__section" aria-labelledby="company-jobs-title">
            <div className="public-company-profile__section-heading">
              <div>
                <span className="public-company-profile__eyebrow">Open opportunities</span>
                <h2 id="company-jobs-title">Jobs at {company.name}</h2>
              </div>
              <span className="public-company-profile__job-count">{totalJobs} available</span>
            </div>
            {jobs.length > 0 ? (
              <>
                <div className="public-company-profile__jobs">
                  {jobs.map((job) => <SeekerJobCard key={job.id} job={job} listing publicView showBookmark={false} />)}
                </div>
                {pagination.totalPages > 1 ? (
                  <div className="public-company-profile__pagination" aria-label="Company jobs pagination">
                    <button type="button" className="public-company-profile__page-button" disabled={!pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous jobs page">Previous</button>
                    <span className="public-company-profile__page-indicator">Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" className="public-company-profile__page-button" disabled={!pagination.hasNextPage} onClick={() => setPage((current) => current + 1)} aria-label="Next jobs page">Next</button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="public-company-profile__no-jobs">
                <h3>No jobs posted yet</h3>
                <p>This company has not posted any available jobs on LeamJobs yet.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="public-company-profile__aside">
          <section className="public-company-profile__section">
            <h2>Company information</h2>
            {companyDetails.length > 0 ? (
              <dl className="public-company-profile__details">
                {companyDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            ) : <p>Company information has not been added yet.</p>}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default CompanyProfilePage;
