import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmJobUpdatesSubscription, unsubscribeFromJobUpdates } from '../../services/api';

function PublicJobUpdatesUnsubscribePage() {
  const [params] = useSearchParams();
  const isConfirmation = params.get('action') === 'confirm';
  const token = params.get('token') || '';
  return <JobUpdatesUnsubscribeContent key={params.toString()} isConfirmation={isConfirmation} token={token} />;
}

type JobUpdatesUnsubscribeContentProps = {
  isConfirmation: boolean;
  token: string;
};

function JobUpdatesUnsubscribeContent({ isConfirmation, token }: JobUpdatesUnsubscribeContentProps) {
  const [message, setMessage] = useState(isConfirmation ? '' : 'Turning off job updates...');
  const [error, setError] = useState(
    isConfirmation && !token ? 'This confirmation link is incomplete or invalid.' : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isConfirmation) return;
    if (!token) { setError('This unsubscribe link is invalid.'); setMessage(''); return; }
    let isCurrent = true;
    void unsubscribeFromJobUpdates(token).then((result) => {
      if (!isCurrent) return;
      if (result.ok) setMessage(result.data.data.message);
      else { setError(result.error.message || 'This unsubscribe link is invalid or expired.'); setMessage(''); }
    });
    return () => { isCurrent = false; };
  }, [isConfirmation, token]);

  const confirmSubscription = async () => {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await confirmJobUpdatesSubscription(token);
      if (result.ok) setMessage(result.data.data.message);
      else setError(result.error.message || 'This confirmation link is invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section className="auth-page" aria-labelledby="unsubscribe-title"><div className="auth-shell auth-shell--single"><div className="auth-panel auth-panel--form"><div className="auth-form-heading"><span>Job updates</span><h1 id="unsubscribe-title">{isConfirmation ? 'Confirm your subscription' : 'Email preferences updated'}</h1></div>{message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}{error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}{isConfirmation && token && !message ? <><p>Confirm your email address to receive optional LeamJobs job update emails.</p><button type="button" className="auth-submit" onClick={() => void confirmSubscription()} disabled={isSubmitting}>{isSubmitting ? 'Confirming...' : 'Confirm subscription'}</button></> : null}<p className="auth-switch"><Link to="/">Return to LeamJobs</Link></p></div></div></section>;
}

export default PublicJobUpdatesUnsubscribePage;
