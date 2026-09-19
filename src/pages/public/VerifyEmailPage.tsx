import { FormEvent, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import { resendEmailVerification, verifyEmailCode } from '../../services/api';
import { getUserFacingError } from '../../utils/userFacingError';

export type VerifyEmailPageProps = {
  role?: 'seeker' | 'employer';
};

const authCopy = {
  seeker: {
    eyebrow: 'Check your inbox',
    title: 'Verify your email address',
    description: 'We sent a 6-digit code to your email so you can finish setting up your account.',
    submitLabel: 'Verify email',
    signInPath: '/login',
    signInText: 'Back to sign in',
    signupPath: '/register',
  },
  employer: {
    eyebrow: 'Account verification',
    title: 'Verify your employer account',
    description: 'Enter the 6-digit code from your inbox to activate your hiring workspace.',
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
  const copy = authCopy[role];

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
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;

    const interval = window.setInterval(() => {
      setCooldownLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownLeft]);

  const isCodeValid = /^\d{6}$/.test(code);
  const hasUsableEmail = Boolean(email && email.includes('@') && email.includes('.'));

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

    if (!isCodeValid) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyEmailCode(email, code);

      if (result.ok) {
        setMessage(result.data.message || 'Your email has been verified successfully.');
        setCode('');
        return;
      }

      setError(result.error.message || 'We could not verify your email. Please try again.');
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

  if (!hasUsableEmail) {
    return (
      <section className="auth-page" aria-labelledby="verify-email-title">
        <div className="auth-shell auth-shell--single">
          <div className="auth-panel auth-panel--form">
            <div className="auth-form-heading">
              <span>{copy.eyebrow}</span>
              <h1 id="verify-email-title">{copy.title}</h1>
              <p>We could not find the email tied to this verification request. Please start again and enter the correct email.</p>
            </div>

            <div className="auth-form-actions">
              <Button type="button" variant="primary" onClick={() => navigate(copy.signupPath, { replace: true })}>
                Return to sign up
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page" aria-labelledby="verify-email-title">
      <div className="auth-shell auth-shell--single">
        <div className="auth-panel auth-panel--form">
          <div className="auth-form-heading">
            <span>{copy.eyebrow}</span>
            <h1 id="verify-email-title">{copy.title}</h1>
            <p>{copy.description}</p>
          </div>

          <div className="auth-field">
            <span>Email address</span>
            <div className="auth-input-wrap auth-input-wrap--readonly">
              <span>{email}</span>
            </div>
          </div>

          {message ? <p className="auth-feedback auth-feedback--success" role="status">{message}</p> : null}
          {error ? <p className="auth-feedback auth-feedback--error" role="alert">{error}</p> : null}

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

            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting || isResending || !isCodeValid}>
              {isSubmitting ? 'Verifying...' : copy.submitLabel}
            </Button>
          </form>

          <div className="auth-secondary-actions">
            <button
              type="button"
              className="auth-action-button"
              onClick={handleResend}
              disabled={isResending || cooldownLeft > 0}
            >
              {isResending ? 'Sending...' : cooldownLeft > 0 ? `Resend code in ${cooldownLeft}s` : 'Resend code'}
            </button>
            <button type="button" className="auth-action-button auth-action-button--muted" onClick={handleChangeEmail}>
              Change email
            </button>
            <Link className="auth-secondary-actions__signin" to={copy.signInPath}>{copy.signInText}</Link>
          </div>

          {message ? (
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
