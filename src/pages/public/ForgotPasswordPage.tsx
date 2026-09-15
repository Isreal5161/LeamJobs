import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { requestPasswordReset } from '../../services/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    if (result.ok) setMessage(result.data.message);
    else setError(result.error.message || 'Unable to process this request.');
    setIsSubmitting(false);
  };

  return <section className="auth-page" aria-labelledby="forgot-password-title"><div className="auth-shell auth-shell--single"><div className="auth-panel auth-panel--form"><div className="auth-form-heading"><span>Account security</span><h1 id="forgot-password-title">Reset your password</h1><p>Enter your account email and we will send a secure reset link if the account exists.</p></div>{message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}{error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}<form className="auth-form" onSubmit={handleSubmit} noValidate><label className="auth-field"><span>Email address</span><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send reset link'}</Button></form><p className="auth-switch"><Link to="/login">Back to sign in</Link></p></div></div></section>;
}

export default ForgotPasswordPage;
