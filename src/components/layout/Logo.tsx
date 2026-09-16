import { Link } from 'react-router-dom';

type LogoProps = { className?: string; tagline?: string };

function Logo({ className = '', tagline }: LogoProps) {
  return (
    <Link to="/" className={`site-logo ${className}`.trim()} aria-label="Go to LeamJobs welcome page">
      <img className="site-logo__image" src="/leamjobs-2.png" alt="LeamJobs" />
      {tagline ? <span className="site-logo__tagline">{tagline}</span> : null}
    </Link>
  );
}

export default Logo;
