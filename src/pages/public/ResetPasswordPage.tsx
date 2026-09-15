import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { resetPassword } from '../../services/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    if (result.ok) setMessage(result.data.message);
    else setError(result.error.message || 'This reset link is invalid or expired.');
    setIsSubmitting(false);
  };

  return <section className="auth-page" aria-labelledby="reset-password-title"><div className="auth-shell auth-shell--single"><div className="auth-panel auth-panel--form"><div className="auth-form-heading"><span>Account security</span><h1 id="reset-password-title">Choose a new password</h1></div>{message ? <p className="auth-feedback auth-feedback--success" role="status">{message} <Link to="/login">Sign in</Link></p> : null}{error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}{!message ? <form className="auth-form" onSubmit={handleSubmit} noValidate><label className="auth-field"><span>New password</span><Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label><label className="auth-field"><span>Confirm password</span><Input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} /></label><Button type="submit" variant="primary" fullWidth disabled={isSubmitting || !token}>{isSubmitting ? 'Saving...' : 'Set new password'}</Button></form> : null}</div></div></section>;
}

export default ResetPasswordPage;
