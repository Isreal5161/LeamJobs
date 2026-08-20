import Button from '../../components/common/Button';
import {
  FaBookmark,
  FaBriefcase,
  FaBuilding,
  FaBullseye,
  FaDollarSign,
  FaGoogle,
  FaRocket,
  FaSlack,
  FaWifi,
} from 'react-icons/fa';
import { SiDropbox } from 'react-icons/si';

const recommendedJobs = [
  { icon: <FaGoogle />, title: 'Senior Product Designer', meta: 'Google - New York, NY - Remote', match: '95% match' },
  { icon: <FaSlack />, title: 'Product Design Lead', meta: 'Slack - San Francisco, CA - Hybrid', match: '89% match' },
  { icon: <SiDropbox />, title: 'Design Systems Manager', meta: 'Dropbox - Austin, TX - Remote', match: '82% match' },
];

const features = [
  {
    icon: <FaBullseye />,
    title: 'Smart matching',
    text: 'Our AI matches you with jobs that fit your skills, experience, and career goals.',
    preview: (
      <div className="features-preview features-preview--score">
        <span>Match score</span>
        <strong>95%</strong>
        <small>Excellent match</small>
      </div>
    ),
  },
  {
    icon: <FaBookmark />,
    title: 'Save jobs',
    text: 'Bookmark jobs you love and come back to them anytime.',
    preview: (
      <div className="features-preview features-preview--saved">
        <span>Saved jobs</span>
        <p>Senior Product Designer</p>
        <p>Product Design Lead</p>
        <small>View all saved jobs -&gt;</small>
      </div>
    ),
  },
  {
    icon: <FaBriefcase />,
    title: 'Track applications',
    text: 'Keep track of every application and stay organized in one place.',
    preview: (
      <div className="features-preview features-preview--apps">
        <span>Your applications</span>
        <p>Google <b>Interview</b></p>
        <p>Slack <b>Applied</b></p>
        <small>View all applications -&gt;</small>
      </div>
    ),
  },
  {
    icon: <FaDollarSign />,
    title: 'Salary insights',
    text: 'See real salary ranges and compensation insights for better decisions.',
    preview: (
      <div className="features-preview features-preview--salary">
        <span>Estimated salary</span>
        <strong>$150k - $190k</strong>
        <i />
      </div>
    ),
  },
  {
    icon: <FaBuilding />,
    title: 'Company reviews',
    text: 'Read real reviews from employees to learn about company culture.',
    preview: (
      <div className="features-preview features-preview--reviews">
        <span>Google</span>
        <strong>4.4 stars</strong>
        <small>View all reviews -&gt;</small>
      </div>
    ),
  },
  {
    icon: <FaWifi />,
    title: 'Remote filters',
    text: 'Find remote and hybrid jobs that fit your lifestyle.',
    preview: (
      <div className="features-preview features-preview--filters">
        <span>Workplace type</span>
        <p>[x] Remote</p>
        <p>[x] Hybrid</p>
        <small>View all filters -&gt;</small>
      </div>
    ),
  },
];

function HeroPanel() {
  return (
    <div className="features-hero__panel" aria-label="Recommended jobs and profile progress">
      <article className="features-recommendations">
        <h2>Recommended for you</h2>
        {recommendedJobs.map((job) => (
          <div className="features-job-row" key={job.title}>
            <span className="features-job-row__icon">{job.icon}</span>
            <div>
              <strong>{job.title}</strong>
              <p>{job.meta}</p>
              <small>{job.match}</small>
            </div>
            <FaBookmark className="features-job-row__save" />
          </div>
        ))}
      </article>
      <article className="features-progress">
        <div className="features-progress__ring">72%</div>
        <div>
          <h2>Profile completeness</h2>
          <p>Add skills and experience to increase your match rate.</p>
          <a href="/register">Complete profile -&gt;</a>
        </div>
      </article>
    </div>
  );
}

function FeaturesPage() {
  return (
    <div className="features-page">
      <section className="features-hero">
        <div className="features-hero__content">
          <h1>Features that make job search smarter</h1>
          <p>
            LeamJobs gives you the tools and insights you need to find the right opportunities,
            faster and with confidence.
          </p>
          <div className="features-hero__actions">
            <Button variant="primary">Create free account</Button>
            <Button variant="outline">I already have one</Button>
          </div>
        </div>
        <HeroPanel />
      </section>

      <section className="features-grid" aria-label="LeamJobs features">
        {features.map((feature) => (
          <article className="features-card" key={feature.title}>
            <div className="features-card__icon">{feature.icon}</div>
            <div className="features-card__copy">
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </div>
            {feature.preview}
          </article>
        ))}
      </section>

      <section className="features-cta">
        <div className="features-cta__icon">
          <FaRocket />
        </div>
        <div>
          <h2>Everything you need to find your next great opportunity</h2>
          <p>Join millions of professionals using LeamJobs to build their dream careers.</p>
        </div>
        <Button variant="primary">Create free account</Button>
      </section>
    </div>
  );
}

export default FeaturesPage;
