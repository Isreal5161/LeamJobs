import { FormEvent, useEffect, useRef, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { subscribeToJobUpdates } from '../../services/api';

const DISMISSED_KEY = 'leamjobs_job_updates_popup_dismissed';
const SUCCESS_KEY = 'leamjobs_job_updates_popup_subscribed';

type JobUpdatesSubscriptionPopupProps = {
  enabled?: boolean;
};

function JobUpdatesSubscriptionPopup({ enabled = true }: JobUpdatesSubscriptionPopupProps) {
  const { token, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled || authLoading || token || sessionStorage.getItem(DISMISSED_KEY) || sessionStorage.getItem(SUCCESS_KEY)) return undefined;
    const timer = window.setTimeout(() => setIsOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, [authLoading, enabled, token]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'submitting') closePopup();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, status]);

  const closePopup = () => {
    if (status === 'submitting') return;
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setIsOpen(false);
    window.setTimeout(() => closeRef.current?.focus(), 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('submitting');
    const result = await subscribeToJobUpdates(email.trim());
    if (result.ok) {
      sessionStorage.setItem(SUCCESS_KEY, 'true');
      setStatus('success');
      return;
    }
    setError(result.error.message || 'We could not subscribe you right now. Please try again.');
    setStatus('idle');
  };

  if (!isOpen) return null;

  return (
    <div className="job-updates-popup-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && status !== 'submitting') closePopup(); }}>
      <section className="job-updates-popup" role="dialog" aria-modal="true" aria-labelledby="job-updates-popup-title" aria-describedby="job-updates-popup-description">
        <button ref={closeRef} type="button" className="job-updates-popup__close" onClick={closePopup} aria-label="Close job updates subscription">
          <FaTimes aria-hidden="true" />
        </button>
        {status === 'success' ? (
          <div className="job-updates-popup__success">
            <span className="job-updates-popup__success-icon"><FaCheck aria-hidden="true" /></span>
            <h2 id="job-updates-popup-title">You're subscribed</h2>
            <p id="job-updates-popup-description">You'll receive updates about new jobs from LeamJobs.</p>
            <button type="button" className="job-updates-popup__button" onClick={closePopup}>Done</button>
          </div>
        ) : (
          <>
            <span className="job-updates-popup__eyebrow">Stay in the loop</span>
            <h2 id="job-updates-popup-title">Get updates for the latest jobs</h2>
            <p id="job-updates-popup-description">Subscribe to receive new job opportunities and important job updates from LeamJobs.</p>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label htmlFor="job-updates-popup-email">Email address</label>
              <input ref={emailRef} id="job-updates-popup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              {error ? <p className="job-updates-popup__error" role="alert">{error}</p> : null}
              <button type="submit" className="job-updates-popup__button" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            <small>You can unsubscribe at any time.</small>
          </>
        )}
      </section>
    </div>
  );
}

export default JobUpdatesSubscriptionPopup;
