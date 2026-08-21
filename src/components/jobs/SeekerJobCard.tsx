import { Link } from 'react-router-dom';
import { FaBookmark } from 'react-icons/fa';
import BookmarkButton from '../common/BookmarkButton';
import CompanyLogo from './CompanyLogo';
import type { RecommendedJob } from './JobCard';

type SeekerJobCardProps = {
  job: RecommendedJob;
  saved?: boolean;
  listing?: boolean;
  onToggleBookmark?: () => void;
};

function SeekerJobCard({ job, saved = false, listing = false, onToggleBookmark }: SeekerJobCardProps) {
  const detailPath = `/seeker/jobs/${job.id}`;

  return (
    <article className={`seeker-job-card${listing ? ' seeker-job-card--listing' : ''}`}>
      <Link className="seeker-job-card__body-link" to={detailPath} aria-label={`View ${job.role} at ${job.company}`}>
        <CompanyLogo company={job.company} logoText={job.logoText} logoClass={`${job.logoClass ?? ''} seeker-job-card__logo`} />
        <div className="seeker-job-card__content">
          <div className="seeker-job-card__top">
            <h3>{job.company}</h3>
            {job.featured && (
              <span>
                <FaBookmark />
                Featured
              </span>
            )}
          </div>
          <h4>{job.role}</h4>
          <p>
            {job.salary} <span /> {job.location}
          </p>
          <div className="seeker-job-card__tags">
            {[job.workType, job.level, job.workArrangement].map((tag, index) => (
              <small className={`seeker-tag seeker-tag--${index}`} key={tag}>
                {tag}
              </small>
            ))}
          </div>
          <p className="seeker-job-card__description">{job.description}</p>
        </div>
      </Link>

      <BookmarkButton
        className="seeker-job-card__save"
        saved={saved}
        onToggle={onToggleBookmark ?? (() => {})}
        ariaLabel={saved ? `Remove ${job.company} ${job.role} from saved jobs` : `Save ${job.company} ${job.role}`}
      />
      <Link className="seeker-job-card__apply" to={detailPath}>
        Details
      </Link>
    </article>
  );
}

export default SeekerJobCard;
