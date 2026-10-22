import { Link } from 'react-router-dom';
import CompanyLogo from './CompanyLogo';
import BookmarkButton from '../common/BookmarkButton';
import type { PublicJob } from '../../data/jobData';

type JobCardProps = {
  id: string;
  employerId?: string;
  company: string;
  logoUrl?: string | null;
  logoText: string;
  logoClass?: string;
  featured?: boolean;
  role: string;
  salary: string;
  location: string;
  workArrangement: string;
  workType: string;
  level: string;
  description: string;
  saved?: boolean;
  onToggleBookmark?: () => void;
  onApply?: () => void;
  onViewDetails?: () => void;
};

export type RecommendedJob = PublicJob;

const formatSalary = (salary: string) => salary.replace(/\d+(?:\.\d+)?/g, (amount) => {
  const value = Number(amount);
  return Number.isFinite(value) ? new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(value) : amount;
});

function JobCard({
  id,
  employerId,
  company,
  logoUrl,
  logoText,
  logoClass,
  featured = false,
  role,
  salary,
  location,
  workArrangement,
  workType,
  level,
  description,
  saved = false,
  onToggleBookmark,
  onApply,
  onViewDetails,
}: JobCardProps) {
  return (
    <article className="job-card">
      <div className="job-card__inner">
        <div className="job-card__logo-column">
          <CompanyLogo company={company} logoUrl={logoUrl} logoText={logoText} logoClass={logoClass} />
        </div>

        <div className="job-card__content">
          <div className="job-card__company-top">
            <p className="job-card__company-name">
              {employerId ? <Link to={`/companies/${encodeURIComponent(employerId)}`}>{company}</Link> : company}
            </p>
            {featured && <span className="job-card__featured">Featured</span>}
          </div>
          <h3 className="job-card__role">{role}</h3>
          <p className="job-card__meta"><strong className="job-card__salary">{formatSalary(salary)}</strong> · {location} · {workArrangement}</p>
        </div>

        <div className="job-card__actions">
          <div className="job-card__tags">
            <span className="job-tag job-tag--green">{workType}</span>
            <span className="job-tag job-tag--lavender">{level}</span>
            <span className="job-tag job-tag--blue">{workArrangement}</span>
          </div>
          <div className="job-card__buttons">
            <BookmarkButton
              saved={saved}
              onToggle={onToggleBookmark ?? (() => {})}
              ariaLabel={saved ? `Remove ${company} ${role} from saved jobs` : `Save ${company} ${role}`}
            />
            <Link className="button button--detail" to={`/jobs/${id}`} onClick={onViewDetails ?? (() => {})}>
              Details
            </Link>
            <Link className="button button--apply" to={`/seeker/applications?jobId=${id}&apply=true`} onClick={onApply}>
              Apply
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default JobCard;
