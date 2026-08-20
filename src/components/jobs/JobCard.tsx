import CompanyLogo from './CompanyLogo';
import BookmarkButton from '../common/BookmarkButton';

type JobCardProps = {
  id: string;
  company: string;
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

export type RecommendedJob = {
  id: string;
  company: string;
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
  postedAt: number;
  salaryHigh: number;
};

function JobCard({
  id,
  company,
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
          <CompanyLogo company={company} logoText={logoText} logoClass={logoClass} />
        </div>

        <div className="job-card__content">
          <div className="job-card__company-top">
            <p className="job-card__company-name">{company}</p>
            {featured && <span className="job-card__featured">Featured</span>}
          </div>
          <h3 className="job-card__role">{role}</h3>
          <p className="job-card__meta">{salary} · {location} · {workArrangement}</p>
          <p className="job-card__description">{description}</p>
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
            <button className="button button--detail" type="button" onClick={onViewDetails ?? (() => {})}>
              Details
            </button>
            <button className="button button--apply" type="button" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default JobCard;
