import { FormEvent, useEffect, useRef, useState } from 'react';
import { FaBuilding, FaCheckCircle, FaPhoneAlt } from 'react-icons/fa';
import { completeEmployerProfile } from '../../services/api';
import '../../styles/employer-profile-completion.css';

type EmployerProfileCompletionModalProps = {
  token: string;
  companyName?: string;
  phone?: string | null;
  onComplete: () => void;
};

function EmployerProfileCompletionModal({
  token,
  companyName = '',
  phone = '',
  onComplete,
}: EmployerProfileCompletionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(companyName);
  const [companyPhone, setCompanyPhone] = useState(phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isSaved) return undefined;
    const timer = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(timer);
  }, [isSaved, onComplete]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isSaved) return;

    const nextErrors: Record<string, string> = {};
    const normalizedName = name.trim();
    const normalizedPhone = companyPhone.trim();
    if (!normalizedName) nextErrors.companyName = 'Enter your company name.';
    else if (normalizedName.length > 160) nextErrors.companyName = 'Company name must be 160 characters or fewer.';
    if (!normalizedPhone) nextErrors.phone = 'Enter your company phone number.';
    else if (normalizedPhone.length > 40) nextErrors.phone = 'Phone number must be 40 characters or fewer.';

    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    const result = await completeEmployerProfile({
      companyName: normalizedName,
      phone: normalizedPhone,
    }, token);
    setIsSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors ?? {});
      setRequestError(result.error.message || 'We could not save your company details. Please try again.');
      return;
    }

    setIsSaved(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className="employer-profile-completion"
      aria-labelledby="employer-profile-completion-title"
      aria-describedby="employer-profile-completion-description"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="employer-profile-completion__brand-mark" aria-hidden="true"><FaBuilding /></div>
      <span className="employer-profile-completion__eyebrow">One last step</span>
      <h2 id="employer-profile-completion-title">Complete Your Company Profile</h2>
      <p id="employer-profile-completion-description">
        Add your company name and phone number to finish setting up your employer account.
      </p>

      {isSaved ? (
        <div className="employer-profile-completion__success" role="status" aria-live="polite">
          <FaCheckCircle aria-hidden="true" />
          <span>Your company profile is saved. Opening your employer dashboard…</span>
        </div>
      ) : (
        <form className="employer-profile-completion__form" onSubmit={submit} noValidate>
          <label htmlFor="employer-company-name">Company name</label>
          <div className="employer-profile-completion__input-wrap">
            <FaBuilding aria-hidden="true" />
            <input
              id="employer-company-name"
              name="companyName"
              type="text"
              autoComplete="organization"
              autoFocus
              maxLength={160}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setRequestError('');
                setErrors((current) => ({ ...current, companyName: '' }));
              }}
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={errors.companyName ? 'employer-company-name-error' : undefined}
              disabled={isSaving}
              required
            />
          </div>
          {errors.companyName ? <small id="employer-company-name-error" role="alert">{errors.companyName}</small> : null}

          <label htmlFor="employer-company-phone">Company phone number</label>
          <div className="employer-profile-completion__input-wrap">
            <FaPhoneAlt aria-hidden="true" />
            <input
              id="employer-company-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={companyPhone}
              onChange={(event) => {
                setCompanyPhone(event.target.value);
                setRequestError('');
                setErrors((current) => ({ ...current, phone: '' }));
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'employer-company-phone-error' : undefined}
              disabled={isSaving}
              required
            />
          </div>
          {errors.phone ? <small id="employer-company-phone-error" role="alert">{errors.phone}</small> : null}

          {requestError ? <p className="employer-profile-completion__error" role="alert">{requestError}</p> : null}

          <button type="submit" className="employer-profile-completion__submit" disabled={isSaving}>
            {isSaving ? 'Saving company details…' : 'Save and continue'}
          </button>
        </form>
      )}
    </dialog>
  );
}

export default EmployerProfileCompletionModal;
