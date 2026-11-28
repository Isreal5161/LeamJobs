import { FormEvent, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { completeGoogleRegistration, getGoogleRegistrationStatus, resendEmailVerification, verifyEmailCode, verifyGoogleEmailCode } from '../../services/api';
import { getUserFacingError } from '../../utils/userFacingError';

export type VerifyEmailPageProps = {
  role?: 'seeker' | 'employer';
};

const authCopy = {
  seeker: {
    eyebrow: 'Check your inbox',
    title: 'Verify your email address',
    description: 'If this email needs verification, enter the 6-digit code sent to your inbox to finish setting up your account.',
    submitLabel: 'Verify email',
    signInPath: '/login',
    signInText: 'Back to sign in',
    signupPath: '/register',
  },
  employer: {
    eyebrow: 'Account verification',
    title: 'Verify your employer account',
    description: 'If this email needs verification, enter the 6-digit code sent to your inbox to activate your hiring workspace.',
    submitLabel: 'Verify account',
    signInPath: '/employers/login',
    signInText: 'Back to employer sign in',
    signupPath: '/employers/register',
  },
} as const;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function VerifyEmailPage({ role = 'seeker' }: VerifyEmailPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthenticatedSession } = useAuth();
  const verificationRequiredFromLogin = (location.state as { verificationRequired?: boolean } | null)?.verificationRequired === true;
  const manualRegistrationPending = ['pending', 'success'].includes(searchParams.get('registration') ?? '')
    || (location.state as { registrationPending?: boolean; registrationComplete?: boolean } | null)?.registrationPending === true
    || (location.state as { registrationComplete?: boolean } | null)?.registrationComplete === true;
  const googlePendingId = searchParams.get('pendingId')?.trim() ?? '';
  const callbackRole = searchParams.get('role')?.trim().toUpperCase();
  const initialAccountRole = callbackRole === 'EMPLOYER' || role === 'employer' ? 'employer' : 'seeker';
  const [accountRole, setAccountRole] = useState<'seeker' | 'employer'>(initialAccountRole);
  const copy = authCopy[accountRole];
  const signInPath = manualRegistrationPending ? '/choose-sign-in' : copy.signInPath;
  const signInText = manualRegistrationPending ? 'Choose account type to sign in' : copy.signInText;
  const isGoogleFlow = searchParams.has('pendingId') || searchParams.has('role');

  const initialEmail = useMemo(() => {
    const stateEmail = typeof location.state === 'object' && location.state !== null && 'email' in location.state
      ? String((location.state as { email?: string }).email ?? '')
      : '';
    const queryEmail = searchParams.get('email') ?? '';
    return normalizeEmail(stateEmail || queryEmail);
  }, [location.state, searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [isCompletingGoogleRegistration, setIsCompletingGoogleRegistration] = useState(false);
  const [googleVerificationRequired, setGoogleVerificationRequired] = useState(false);
  const [googleEmailVerified, setGoogleEmailVerified] = useState(false);
  const [googleStatusLoaded, setGoogleStatusLoaded] = useState(!isGoogleFlow);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!isGoogleFlow) return;
    if (!googlePendingId) {
      setGoogleStatusLoaded(true);
      setError('Your Google sign-up session is incomplete or expired. Please start again.');
      return;
    }

    let isMounted = true;
    setGoogleStatusLoaded(false);

    void getGoogleRegistrationStatus(googlePendingId).then((result) => {
      if (!isMounted) return;
      if (!result.ok) {
        setEmail('');
        setError(result.error.message || 'Your Google sign-up session is incomplete or expired. Please start again.');
        setGoogleStatusLoaded(true);
        return;
      }

      const { data: status } = result.data;
      setEmail(normalizeEmail(status.email));
      setAccountRole(status.role === 'EMPLOYER' ? 'employer' : 'seeker');
      setGoogleVerificationRequired(status.requiresEmailVerification);
      setGoogleEmailVerified(!status.requiresEmailVerification);
      setError('');
      setGoogleStatusLoaded(true);
    }).catch((statusError: unknown) => {
      if (!isMounted) return;
      setEmail('');
      setError(getUserFacingError(statusError, 'auth').message);
      setGoogleStatusLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [googlePendingId, isGoogleFlow]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;

    const interval = window.setInterval(() => {
      setCooldownLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownLeft]);

  const isCodeValid = /^\d{6}$/.test(code);
  const hasUsableEmail = Boolean(email && email.includes('@') && email.includes('.'));

  const finishGoogleRegistration = async () => {
    if (!googlePendingId) {
      setError('Your Google sign-up session is incomplete. Please start again.');
      return;
    }

    setError('');
    setMessage('');
    setIsCompletingGoogleRegistration(true);

    try {
      const completion = await completeGoogleRegistration({
        pendingId: googlePendingId,
        email,
      });

      if (!completion.ok) {
        if (completion.status === 403) {
          setGoogleVerificationRequired(true);
          setError('');
        } else {
          setError(completion.error.message || 'Google sign-up could not be completed. Please start again.');
        }
        return;
      }

      const user = completion.data.user;
      setAuthenticatedSession(completion.data.token, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        ...(user.phone ? { phone: user.phone } : {}),
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      });
      navigate(user.role === 'EMPLOYER' ? '/employer/jobs' : '/seeker/dashboard', { replace: true });
    } catch (completionError) {
      setError(getUserFacingError(completionError, 'auth').message);
    } finally {
      setIsCompletingGoogleRegistration(false);
    }
  };

  const updateCodeAt = (index: number, value: string) => {
    const nextCode = Array.from({ length: 6 }, (_, codeIndex) => code[codeIndex] ?? '');
    nextCode[index] = value.replace(/\D/g, '').slice(-1);
    setCode(nextCode.join('').slice(0, 6));
  };

  const handleCodeChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      updateCodeAt(index, '');
      return;
    }

    const nextCode = Array.from({ length: 6 }, (_, codeIndex) => code[codeIndex] ?? '');
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
      nextCode[index + offset] = digit;
    });
    setCode(nextCode.join('').slice(0, 6));
    codeInputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const handleCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      codeInputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pastedCode);
    codeInputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
  };

  const handleChangeEmail = () => {
    const targetUrl = `${copy.signupPath}?email=${encodeURIComponent(email || '')}`;
    navigate(targetUrl, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!hasUsableEmail) {
      setError('We could not find the email connected to this verification request. Please return to sign up and enter it again.');
      return;
    }

    if (googleVerificationRequired && !googleEmailVerified && !isCodeValid) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isGoogleFlow) {
        const result = await verifyEmailCode(email, code);

        if (result.ok) {
          setAuthenticatedSession(result.data.token, result.data.user);
          navigate(result.data.user.role === 'EMPLOYER' ? '/employer/jobs' : '/seeker/dashboard', { replace: true });
          return;
        }

        setError(result.error.message || 'We could not verify your email. Please try again.');
        return;
      }

      if (googleVerificationRequired && !googleEmailVerified) {
        const verification = await verifyGoogleEmailCode(email, code, googlePendingId);

        if (!verification.ok) {
          setError(verification.error.message || 'We could not verify your email. Please try again.');
          return;
        }
        if (verification.data.user.role !== (accountRole === 'employer' ? 'EMPLOYER' : 'SEEKER')) {
          setError('The verified account does not match this Google sign-up session. Please restart Google sign-up.');
          return;
        }
        const user = verification.data.user;
        setAuthenticatedSession(verification.data.token, user);
        navigate(user.role === 'EMPLOYER' ? '/employer/jobs' : '/seeker/dashboard', { replace: true });
        return;
      }

      await finishGoogleRegistration();
    } catch (submissionError) {
      setError(getUserFacingError(submissionError, 'auth').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!hasUsableEmail) {
      setError('Enter your email address before requesting a new code.');
      return;
    }

    if (cooldownLeft > 0) {
      return;
    }

    setError('');
    setMessage('');
    setIsResending(true);

    try {
      const result = await resendEmailVerification(email);

      if (result.ok) {
        setMessage(result.data.message || 'A new verification code has been sent.');
        setCooldownLeft(60);
        setCode('');
        return;
      }

      setError(result.error.message || 'We could not send a new code right now.');
    } catch (resendError) {
      setError(getUserFacingError(resendError, 'auth').message);
    } finally {
      setIsResending(false);
    }
  };

  if (isGoogleFlow && !googlePendingId) {
    return (
      <section className="auth-page auth-page--verify-email" aria-labelledby="verify-email-title">
        <div className="auth-shell auth-shell--single auth-shell--verify-email">
          <div className="auth-panel auth-panel--form auth-panel--verify-email">
            <div className="auth-verify-icon" aria-hidden="true"><FaEnvelope /></div>
            <div className="auth-form-heading">
              <span>{copy.eyebrow}</span>
              <h1 className="auth-verify-title" id="verify-email-title">{copy.title}</h1>
              <p>Your Google sign-up session is incomplete or invalid. Please start again.</p>
            </div>
            <div className="auth-form-actions">
              <Button type="button" variant="primary" onClick={() => navigate(copy.signupPath, { replace: true })}>
                Return to sign up
              </Button>
              <Link className="auth-secondary-actions__signin" to={copy.signInPath}>{copy.signInText}</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isGoogleFlow && !googleStatusLoaded) {
    return (
      <section className="auth-page auth-page--verify-email" aria-labelledby="verify-email-title">
        <div className="auth-shell auth-shell--single auth-shell--verify-email">
          <div className="auth-panel auth-panel--form auth-panel--verify-email" role="status" aria-live="polite">
            <div className="auth-verify-icon" aria-hidden="true"><FaEnvelope /></div>
            <div className="auth-form-heading">
              <span>Google account setup</span>
              <h1 className="auth-verify-title" id="verify-email-title">Checking your sign-up</h1>
              <p>We are securely confirming your Google sign-up session.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasUsableEmail) {
    return (
      <section className="auth-page auth-page--verify-email" aria-labelledby="verify-email-title">
        <div className="auth-shell auth-shell--single auth-shell--verify-email">
          <div className="auth-panel auth-panel--form auth-panel--verify-email">
            <div className="auth-verify-icon" aria-hidden="true"><FaEnvelope /></div>
            <div className="auth-form-heading">
              <span>{copy.eyebrow}</span>
              <h1 className="auth-verify-title" id="verify-email-title">{copy.title}</h1>
              <p>{error || 'We could not verify this sign-up session. Please start again.'}</p>
            </div>
            <div className="auth-form-actions">
              <Button type="button" variant="primary" onClick={() => navigate(copy.signupPath, { replace: true })}>
                Restart sign-up
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page auth-page--verify-email" aria-labelledby="verify-email-title">
      <div className="auth-shell auth-shell--single auth-shell--verify-email">
        <div className="auth-panel auth-panel--form auth-panel--verify-email">
          <div className="auth-verify-icon" aria-hidden="true"><FaEnvelope /></div>
          <div className="auth-form-heading">
            <span>{copy.eyebrow}</span>
            <h1 className="auth-verify-title" id="verify-email-title">
              {manualRegistrationPending
                ? accountRole === 'employer' ? 'Verify your employer email' : 'Verify your email address'
                : copy.title}
            </h1>
            <p>{isGoogleFlow && !googleVerificationRequired
              ? 'Continue with Google to finish signing in or creating your account.'
              : manualRegistrationPending
                ? 'Check your inbox for any verification instructions. If this email needs verification, enter the code or request another. If you already have an account, choose your account type to sign in.'
                : copy.description}</p>
          </div>

          <div className="auth-field">
            <span>Email address</span>
            <div className="auth-input-wrap auth-input-wrap--readonly">
              <FaEnvelope aria-hidden="true" />
              <span>{email}</span>
            </div>
          </div>

          {manualRegistrationPending ? (
            <p className="auth-feedback" role="status">
              If this email needs verification, enter the code sent to <strong>{email}</strong> or request another code. If you already have an account, choose the account type you used to sign in.
            </p>
          ) : null}
          {verificationRequiredFromLogin ? (
            <p className="auth-feedback" role="status">
              Your email must be verified before you can sign in. Enter the code sent to your email or request a new one.
            </p>
          ) : null}
          {message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}
          {error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}

          {isGoogleFlow && !googleVerificationRequired ? (
            <div className="auth-form-actions">
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={isCompletingGoogleRegistration}
                onClick={() => void finishGoogleRegistration()}
              >
                {isCompletingGoogleRegistration ? 'Completing Google sign-in...' : 'Continue with Google'}
              </Button>
            </div>
          ) : (
            <>
              {!isGoogleFlow || googleVerificationRequired ? (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  <div className="auth-field">
                    <span>Verification code</span>
                    <div className="auth-code-inputs" role="group" aria-label="6-digit verification code">
                      {Array.from({ length: 6 }, (_, index) => (
                        <input
                          key={index}
                          ref={(element) => { codeInputRefs.current[index] = element; }}
                          className="auth-code-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          maxLength={index === 0 ? 6 : 1}
                          value={code[index] ?? ''}
                          onChange={(event) => handleCodeChange(index, event.target.value)}
                          onKeyDown={(event) => handleCodeKeyDown(index, event)}
                          onPaste={handleCodePaste}
                          aria-label={`Verification code digit ${index + 1}`}
                          disabled={isSubmitting || isResending}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSubmitting || isResending || isCompletingGoogleRegistration || (googleVerificationRequired && !googleEmailVerified && !isCodeValid)}
                  >
                    {isSubmitting || isCompletingGoogleRegistration
                      ? 'Completing sign-up...'
                      : isGoogleFlow ? 'Verify and complete sign-up' : manualRegistrationPending ? 'Verify email' : copy.submitLabel}
                  </Button>
                </form>
              ) : null}

              {googleVerificationRequired || !isGoogleFlow ? (
                <div className="auth-secondary-actions">
                  <button
                    type="button"
                    className="auth-action-button"
                    onClick={handleResend}
                    disabled={isResending || cooldownLeft > 0}
                  >
                    {isResending ? 'Sending...' : cooldownLeft > 0 ? `Resend code in ${cooldownLeft}s` : 'Resend code'}
                  </button>
                  {!isGoogleFlow ? (
                    <>
                      <button type="button" className="auth-action-button auth-action-button--muted" onClick={handleChangeEmail}>
                        Change email
                      </button>
                      <Link className="auth-secondary-actions__signin" to={signInPath}>{signInText}</Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {isGoogleFlow ? (
            <div className="auth-secondary-actions">
              <Link className="auth-secondary-actions__signin" to={copy.signupPath}>Restart Google sign-up</Link>
              <Link className="auth-secondary-actions__signin" to={copy.signInPath}>{copy.signInText}</Link>
            </div>
          ) : message ? (
            <div className="auth-form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate(copy.signInPath, { replace: true })}>
                Continue to sign in
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default VerifyEmailPage;
