import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { acceptAdminStaffInvitation } from '../../services/api';

function AdminInvitationAcceptancePage() {
  const hasCapturedToken = useRef(false);
  const [token, setToken] = useState('');
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (hasCapturedToken.current) return;
    hasCapturedToken.current = true;

    const capturedToken = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    setToken(capturedToken);
    setIsTokenReady(true);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!token) {
      setError('This invitation link is missing or invalid. Ask your administrator for a new invitation.');
      return;
    }
    if (nameParts.length < 2) {
      setError('Enter your first and last name.');
      return;
    }
    if (nameParts[0].length > 100 || nameParts.slice(1).join(' ').length > 100) {
      setError('Your name is too long. Use up to 100 characters for each name.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password)
      || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Use at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.');
      return;
    }

    setIsSubmitting(true);
    const result = await acceptAdminStaffInvitation({
      token,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error.message || 'The invitation could not be accepted. Check the link or ask for a new invitation.');
      return;
    }

    setToken('');
    setPassword('');
    setConfirmPassword('');
    setIsActivated(true);
  };

  return (
    <main className="admin-invitation-page">
      <section className="admin-invitation-card" aria-labelledby="admin-invitation-title">
        <div className="admin-invitation-brand">
          <span className="admin-invitation-brand__icon" aria-hidden="true"><FaShieldAlt /></span>
          <span>LeamJobs <strong>Admin</strong></span>
        </div>

        {isActivated ? (
          <div className="admin-invitation-success" role="status">
            <span className="admin-invitation-success__mark" aria-hidden="true">✓</span>
            <h1 id="admin-invitation-title">Your account is ready</h1>
            <p>Your administrator account has been activated successfully.</p>
            <Link className="admin-staff-button admin-staff-button--primary" to="/Leamjobs2026admin/login">
              Continue to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="admin-invitation-heading">
              <span className="admin-invitation-eyebrow">Administrator access</span>
              <h1 id="admin-invitation-title">Accept Your Administrator Invitation</h1>
              <p>Set up your account to access the LeamJobs administration workspace.</p>
            </div>

            {!token && !isTokenReady ? (
              <p className="admin-invitation-hint" role="status">Preparing your secure invitation…</p>
            ) : !token ? (
              <div className="admin-staff-alert admin-staff-alert--error" role="alert">
                This invitation link is missing or invalid. Ask your administrator for a new invitation.
              </div>
            ) : (
              <form className="admin-invitation-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
                <label htmlFor="admin-invitation-full-name">Full name</label>
                <input
                  id="admin-invitation-full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  maxLength={202}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  aria-describedby="admin-invitation-name-hint"
                />
                <span id="admin-invitation-name-hint" className="admin-invitation-hint">
                  Enter your first and last name.
                </span>

                <label htmlFor="admin-invitation-password">Create password</label>
                <div className="admin-invitation-password">
                  <input
                    id="admin-invitation-password"
                    name="new-password"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    aria-describedby="admin-invitation-password-hint"
                  />
                  <button
                    type="button"
                    className="admin-invitation-password__toggle"
                    onClick={() => setShowPasswords((visible) => !visible)}
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  >
                    {showPasswords ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                  </button>
                </div>
                <span id="admin-invitation-password-hint" className="admin-invitation-hint">
                  At least 8 characters, with uppercase and lowercase letters, a number, and a symbol.
                </span>

                <label htmlFor="admin-invitation-confirm-password">Confirm password</label>
                <input
                  id="admin-invitation-confirm-password"
                  name="confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />

                {error ? <div className="admin-staff-alert admin-staff-alert--error" role="alert">{error}</div> : null}
                <button className="admin-staff-button admin-staff-button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Activating account…' : 'Activate Account'}
                </button>
              </form>
            )}
            <p className="admin-invitation-login">
              Already activated? <Link to="/Leamjobs2026admin/login">Sign in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminInvitationAcceptancePage;
