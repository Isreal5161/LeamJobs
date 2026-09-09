import { Link } from 'react-router-dom';

type FooterProps = {
  /** 'compact' is the short authenticated seeker/employer footer; default is the full public footer. */
  variant?: 'full' | 'compact';
};

function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'compact') {
    return (
      <footer className="site-footer site-footer--compact">
        <div className="site-footer--compact__inner">
          <p>&copy; {new Date().getFullYear()} LeamJobs</p>
          <nav aria-label="Footer navigation">
            <Link to="/about">About</Link>
            <Link to="/companies">Companies</Link>
            <Link to="/how-it-works">How it works</Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="site-footer__logo">
            <span className="site-logo__mark">LJ</span>
            <span>LearnJobs</span>
          </Link>
          <p>Modern hiring tools for job seekers and companies building better teams.</p>
        </div>

        <nav className="site-footer__links" aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/login">Sign in</Link>
        </nav>

        <form className="site-footer__subscribe" aria-label="Subscribe to job updates">
          <label htmlFor="footer-email">Get job updates</label>
          <div className="site-footer__subscribe-row">
            <input id="footer-email" type="email" placeholder="Email address" />
            <button type="submit">Subscribe</button>
          </div>
        </form>
      </div>

      <div className="container site-footer__bottom">
        <p>&copy; 2026 JobPortal. Crafted for modern hiring experiences.</p>
        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
