import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToJobUpdates } from '../../services/api';
import Logo from './Logo';

type FooterProps = {
  /** 'compact' is the short authenticated seeker/employer footer; default is the full public footer. */
  variant?: 'full' | 'compact';
};

function Footer({ variant = 'full' }: FooterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');
    setError('');
    setIsSubmitting(true);
    const result = await subscribeToJobUpdates(email.trim());
    if (result.ok) { setStatus(result.data.data.message); setEmail(''); }
    else setError(result.error.message || 'Unable to subscribe right now.');
    setIsSubmitting(false);
  };

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
          <Logo className="site-footer__logo" />
          <p>Modern hiring tools for job seekers and companies building better teams.</p>
        </div>

        <nav className="site-footer__links" aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/login">Sign in</Link>
        </nav>

        <form className="site-footer__subscribe" aria-label="Subscribe to job updates" onSubmit={(event) => void handleSubscribe(event)}>
          <label htmlFor="footer-email">Get job updates</label>
          <div className="site-footer__subscribe-row">
            <input id="footer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required />
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Subscribing...' : 'Subscribe'}</button>
          </div>
          {status ? <small role="status">{status}</small> : null}
          {error ? <small role="alert">{error}</small> : null}
          <small>Optional job updates. You can unsubscribe at any time.</small>
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
