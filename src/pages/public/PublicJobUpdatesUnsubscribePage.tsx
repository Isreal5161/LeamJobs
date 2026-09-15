import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { unsubscribeFromJobUpdates } from '../../services/api';

function PublicJobUpdatesUnsubscribePage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Turning off job updates...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setError('This unsubscribe link is invalid.'); setMessage(''); return; }
    void unsubscribeFromJobUpdates(token).then((result) => {
      if (result.ok) setMessage(result.data.data.message);
      else { setError(result.error.message || 'This unsubscribe link is invalid or expired.'); setMessage(''); }
    });
  }, [params]);

  return <section className="auth-page" aria-labelledby="unsubscribe-title"><div className="auth-shell auth-shell--single"><div className="auth-panel auth-panel--form"><div className="auth-form-heading"><span>Job updates</span><h1 id="unsubscribe-title">Email preferences updated</h1></div>{message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}{error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}<p className="auth-switch"><Link to="/">Return to LeamJobs</Link></p></div></div></section>;
}

export default PublicJobUpdatesUnsubscribePage;
