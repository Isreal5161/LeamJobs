import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { unsubscribeFromMarketingEmails } from '../../services/api';

function MarketingUnsubscribePage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Updating your marketing preference...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setMessage(''); setError('This unsubscribe link is invalid.'); return; }
    void unsubscribeFromMarketingEmails(token).then((result) => {
      if (result.ok) setMessage(result.data.data.message);
      else { setMessage(''); setError(result.error.message || 'This unsubscribe link is invalid or expired.'); }
    });
  }, [params]);

  return <section className="auth-page" aria-labelledby="marketing-unsubscribe-title"><div className="auth-shell auth-shell--single"><div className="auth-panel auth-panel--form"><div className="auth-form-heading"><span>Marketing emails</span><h1 id="marketing-unsubscribe-title">Preference updated</h1></div>{message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}{error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}<p className="auth-switch"><Link to="/">Return to LeamJobs</Link></p></div></div></section>;
}

export default MarketingUnsubscribePage;