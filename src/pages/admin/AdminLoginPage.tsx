import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      if (user.role !== 'ADMIN') {
        logout();
        setError('This sign-in page is for administrators only. Use the platform login for seeker or employer accounts.');
        return;
      }

      const from = (location.state as { from?: { pathname?: string } } | null)?.from;
      navigate(from && from.pathname ? from.pathname : '/admin/moderation', { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'We could not sign you in. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="admin-login-title">
      <div className="auth-shell auth-shell--reverse">
        <aside className="auth-panel auth-panel--brand" aria-label="Admin portal overview">
          <div className="auth-brand-card">
            <span className="auth-brand-card__eyebrow">Admin access</span>
            <h1 id="admin-login-title">Secure admin portal</h1>
            <p>
              Manage moderation, approved jobs, content, and platform operations from a dedicated control surface.
            </p>
            <div className="auth-metrics" aria-label="Admin portal capabilities">
              <div>
                <strong>24/7</strong>
                <span>moderation visibility</span>
              </div>
              <div>
                <strong>Role</strong>
                <span>locked to ADMIN only</span>
              </div>
            </div>
          </div>

          <div className="auth-benefits">
            <span>
              <FaShieldAlt />
              Admin-only role enforcement
            </span>
            <span>
              <FaShieldAlt />
              Dedicated moderation workflows
            </span>
            <span>
              <FaShieldAlt />
              Secure account access with existing JWT auth
            </span>
          </div>
        </aside>

        <div className="auth-panel auth-panel--form">
          <div className="auth-form-heading">
            <span>Admin sign in</span>
            <h2>Sign in to Admin Portal</h2>
          </div>

          {error ? (
            <p role="alert" className="auth-error-message">
              {error}
            </p>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Admin email</span>
              <div className="auth-input-wrap">
                <FaEnvelope />
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting || isAuthLoading}
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <FaLock />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting || isAuthLoading}
                  className="auth-password-input"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting || isAuthLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            <Button type="submit" variant="primary" fullWidth className="auth-submit" disabled={isSubmitting || isAuthLoading}>
              {isSubmitting ? 'Signing in...' : 'Sign in to Admin Portal'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AdminLoginPage;
