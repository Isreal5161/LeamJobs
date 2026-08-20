import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="site-logo">
      <span className="site-logo__mark">LJ</span>
      <span className="site-logo__text">LeamJobs</span>
    </Link>
  );
}

export default Logo;
