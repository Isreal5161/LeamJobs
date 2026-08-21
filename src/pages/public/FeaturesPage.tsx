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
import { useSiteContent } from '../../context/SiteContentContext';

function HeroPanel({ recommendations, profileCompletion }: { recommendations: { title: string; meta: string; match: string }[]; profileCompletion: number }) {
  return (
    <div className="features-hero__panel" aria-label="Recommended jobs and profile progress">
      <article className="features-recommendations">
        <h2>Recommended for you</h2>
        {recommendations.map((job, index) => (
          <div className="features-job-row" key={job.title}>
            <span className="features-job-row__icon">{index === 0 ? <FaGoogle /> : index === 1 ? <FaSlack /> : <SiDropbox />}</span>
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
        <div className="features-progress__ring">{profileCompletion}%</div>
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
  const { content } = useSiteContent();
  const { heroTitle, heroSubtitle, primaryCta, secondaryCta, recommendations, profileCompletion, items, ctaTitle, ctaSubtitle, ctaButton } = content.features;

  return (
    <div className="features-page">
      <section className="features-hero">
        <div className="features-hero__content">
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <div className="features-hero__actions">
            <Button variant="primary">{primaryCta}</Button>
            <Button variant="outline">{secondaryCta}</Button>
          </div>
        </div>
        <HeroPanel recommendations={recommendations} profileCompletion={profileCompletion} />
      </section>

      <section className="features-grid" aria-label="LeamJobs features">
        {items.map((feature, index) => (
          <article className="features-card" key={feature.title}>
            <div className="features-card__icon">{index === 0 ? <FaBullseye /> : index === 1 ? <FaBookmark /> : index === 2 ? <FaBriefcase /> : index === 3 ? <FaDollarSign /> : index === 4 ? <FaBuilding /> : <FaWifi />}</div>
            <div className="features-card__copy">
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </div>
            {index === 0 ? <div className="features-preview features-preview--score"><span>Match score</span><strong>95%</strong><small>Excellent match</small></div> : index === 1 ? <div className="features-preview features-preview--saved"><span>Saved jobs</span><p>Senior Product Designer</p><p>Product Design Lead</p><small>View all saved jobs -&gt;</small></div> : index === 2 ? <div className="features-preview features-preview--apps"><span>Your applications</span><p>Google <b>Interview</b></p><p>Slack <b>Applied</b></p><small>View all applications -&gt;</small></div> : index === 3 ? <div className="features-preview features-preview--salary"><span>Estimated salary</span><strong>$150k - $190k</strong><i /></div> : index === 4 ? <div className="features-preview features-preview--reviews"><span>Google</span><strong>4.4 stars</strong><small>View all reviews -&gt;</small></div> : <div className="features-preview features-preview--filters"><span>Workplace type</span><p>[x] Remote</p><p>[x] Hybrid</p><small>View all filters -&gt;</small></div>}
          </article>
        ))}
      </section>

      <section className="features-cta">
        <div className="features-cta__icon">
          <FaRocket />
        </div>
        <div>
          <h2>{ctaTitle}</h2>
          <p>{ctaSubtitle}</p>
        </div>
        <Button variant="primary">{ctaButton}</Button>
      </section>
    </div>
  );
}

export default FeaturesPage;
