import { Link } from 'react-router-dom';
import BookmarkButton from '../common/BookmarkButton';
import CompanyLogo from './CompanyLogo';
import type { RecommendedJob } from './JobCard';
import type { SeekerJobListItem } from '../../services/api';

type SeekerJobCardProps = {
  job: RecommendedJob | SeekerJobListItem;
  saved?: boolean;
  listing?: boolean;
  onToggleBookmark?: () => void;
  showBookmark?: boolean;
  matchScore?: number;
  matchedSkills?: string[];
};

function SeekerJobCard({ job, saved = false, listing = false, onToggleBookmark, showBookmark = true, matchScore, matchedSkills }: SeekerJobCardProps) {
  const isBackendJob = 'jobType' in job && 'skills' in job;
  const company = isBackendJob ? job.company?.name ?? 'Company not provided' : job.company;
  const title = isBackendJob ? job.title : job.role;
  const logoUrl = isBackendJob ? job.company?.logoUrl : undefined;
  const location = job.location;
  const description = job.description;
  const jobType = isBackendJob ? (job.jobType === 'FREELANCE_PROJECT' ? 'Freelance project' : 'Employment') : job.workType;
  const compensation = isBackendJob
    ? job.compensation?.type === 'FREELANCE'
      ? `${job.compensation.currency} ${job.compensation.projectAmount}`
      : job.compensation?.type === 'CONTRACT'
        ? `${job.compensation.currency} ${job.compensation.amount} contract`
        : job.compensation
          ? `${job.compensation.currency} ${job.compensation.salaryMin ?? '-'} - ${job.compensation.salaryMax ?? '-'}`
          : 'Compensation not specified'
    : job.salary;
  const deadline = isBackendJob && job.applicationDeadline
    ? `Apply by ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.applicationDeadline))}`
    : null;
  const detailPath = `/seeker/jobs/${job.id}`;
  const visibleSkills = isBackendJob ? job.skills.slice(0, 3) : [job.level, job.workArrangement];

  return (
    <article className={`seeker-job-card${listing ? ' seeker-job-card--listing' : ''}`}>
      <Link className="seeker-job-card__body-link" to={detailPath} aria-label={`View ${title} at ${company}`}>
        {logoUrl ? <img className="company-logo seeker-job-card__logo" src={logoUrl} alt="" /> : <CompanyLogo company={company} logoText={company.slice(0, 2).toUpperCase()} logoClass="seeker-job-card__logo" />}
        <div className="seeker-job-card__content">
          <div className="seeker-job-card__top">
            {matchScore !== undefined && <span>{matchScore}% Match</span>}
          </div>
          <h3>{title}</h3>
          <h4>{company}</h4>
          <div className="seeker-job-card__metadata">
            <span className="seeker-job-card__compensation">{compensation}</span>
            <span>{location}</span>
            {deadline && <span>{deadline}</span>}
          </div>
          <div className="seeker-job-card__tags">
            {[jobType, ...visibleSkills].map((tag, index) => (
              <small className={`seeker-tag seeker-tag--${index}`} key={`${tag}-${index}`}>
                {tag}
              </small>
            ))}
          </div>
          <p className="seeker-job-card__description">{description}</p>
          {matchedSkills && matchedSkills.length > 0 && <small className="seeker-job-card__matched-skills">Matched skills: {matchedSkills.join(', ')}</small>}
        </div>
      </Link>

      {showBookmark && <BookmarkButton
        className="seeker-job-card__save"
        saved={saved}
        onToggle={onToggleBookmark ?? (() => {})}
        ariaLabel={saved ? `Remove ${company} ${title} from saved jobs` : `Save ${company} ${title}`}
      />}
      <div className="seeker-job-card__actions">
        <Link className="seeker-job-card__apply-btn seeker-job-card__apply-btn--primary" to={detailPath}>
          Apply Now
        </Link>
        <Link className="seeker-job-card__details-link" to={detailPath}>
          View Details
        </Link>
      </div>
    </article>
  );
}

export default SeekerJobCard;
