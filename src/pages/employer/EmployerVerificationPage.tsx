import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { FaBriefcase, FaCheckCircle, FaClock, FaExclamationTriangle, FaFileAlt, FaTimesCircle, FaUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  deleteEmployerVerificationDocument,
  getEmployerVerification,
  getEmployerVerificationDocument,
  submitEmployerVerification,
  uploadEmployerVerificationDocument,
  type EmployerVerificationDocumentKind,
  type EmployerVerificationStatus,
  type EmployerVerificationSummary,
} from '../../services/api';
import {
  employerIndustries,
  employerRegistrationTypes,
  getEmployerVerificationFailureMessage,
  getEmployerVerificationFieldErrors,
  getIndustryFormState,
  getIndustrySubmissionValue,
  getRegistrationTypeFormState,
  getRegistrationTypeSubmissionValue,
  normalizeOptionalHttpUrl,
  type EmployerRegistrationTypeChoice,
} from '../../utils/employerVerificationForm';

const docKinds: { value: EmployerVerificationDocumentKind; label: string }[] = [
  { value: 'CAC', label: 'CAC Registration' },
  { value: 'TRADE_LICENSE', label: 'Trade License' },
  { value: 'TAX_CERTIFICATE', label: 'Tax Certificate' },
  { value: 'UTILITY_BILL', label: 'Utility Bill' },
  { value: 'IDENTITY_SUPPORTING', label: 'Identity or supporting document' },
  { value: 'OTHER', label: 'Other supporting document' },
];

const statusMeta: Record<EmployerVerificationStatus, { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; icon: typeof FaClock }> = {
  PENDING: { label: 'Pending review', tone: 'warning', icon: FaClock },
  APPROVED: { label: 'Approved', tone: 'success', icon: FaCheckCircle },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: FaTimesCircle },
};

const formatDate = (value: string | null) => (value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not available');

type CompanyForm = NonNullable<EmployerVerificationSummary['submittedCompany']>;
const emptyCompany: CompanyForm = {
  companyName: '', companyDescription: '', website: '', industry: '', companySize: '', phoneNumber: '', location: '', address: '', state: '', country: '', linkedinUrl: '', twitterUrl: '', facebookUrl: '',
};

type VerificationDraft = {
  registrationNumber: string;
  registrationType: string;
  registrationTypeChoice: EmployerRegistrationTypeChoice;
  customRegistrationType: string;
  industryChoice: string;
  customIndustry: string;
  company: CompanyForm;
};

function EmployerVerificationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<EmployerVerificationStatus>('PENDING');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationType, setRegistrationType] = useState('CAC');
  const [registrationTypeChoice, setRegistrationTypeChoice] = useState<EmployerRegistrationTypeChoice>('CAC');
  const [customRegistrationType, setCustomRegistrationType] = useState('');
  const [industryChoice, setIndustryChoice] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');
  const [isIndustrySearchOpen, setIsIndustrySearchOpen] = useState(false);
  const [activeIndustryIndex, setActiveIndustryIndex] = useState(0);
  const [documents, setDocuments] = useState<Array<{ id: string; kind: EmployerVerificationDocumentKind; fileName: string; uploadedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedKind, setSelectedKind] = useState<EmployerVerificationDocumentKind>('CAC');
  const [company, setCompany] = useState<CompanyForm>(emptyCompany);

  const createDraft = (): VerificationDraft => ({
    registrationNumber,
    registrationType,
    registrationTypeChoice,
    customRegistrationType,
    industryChoice,
    customIndustry,
    company,
  });

  const clearFieldError = (field: string) => {
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      if (Object.keys(next).length === 0) setError('');
      return next;
    });
  };

  const updateCompanyField = (field: keyof CompanyForm, value: string) => {
    setCompany((current) => ({ ...current, [field]: value }));
    clearFieldError(`company.${field}`);
  };

  const fieldErrorId = (field: string) => `verification-error-${field.replace(/\./g, '-')}`;
  const fieldLabel = (field: string) => ({
    registrationNumber: 'Registration number',
    registrationType: 'Registration type',
    'company.companyName': 'Company name',
    'company.companyDescription': 'Company description',
    'company.website': 'Website',
    'company.industry': 'Industry',
    'company.companySize': 'Company size',
    'company.phoneNumber': 'Phone number',
    'company.location': 'Location',
    'company.address': 'Company address',
    'company.state': 'State',
    'company.country': 'Country',
    'company.linkedinUrl': 'LinkedIn URL',
    'company.twitterUrl': 'X / Twitter URL',
    'company.facebookUrl': 'Facebook URL',
  }[field] ?? field);
  const renderFieldError = (field: string) => validationErrors[field]
    ? <small id={fieldErrorId(field)} className="employer-verification-field-error">{validationErrors[field]}</small>
    : null;

  const focusFirstInvalidField = (fields: Record<string, string>, isOtherRegistrationType = registrationTypeChoice === 'OTHER') => {
    const firstField = Object.keys(fields)[0];
    if (!firstField) return;
    const targetId = firstField === 'registrationNumber'
      ? 'registration-number'
      : firstField === 'registrationType'
        ? isOtherRegistrationType ? 'registration-type-other' : 'registration-type'
        : firstField === 'company.companyName'
          ? 'verification-company-name'
          : firstField === 'company.companyDescription'
            ? 'verification-description'
            : firstField === 'company.industry'
              ? industryChoice === 'Other' ? 'verification-industry-other' : 'verification-industry'
            : `verification-${firstField.replace(/^company\./, '')}`;
    window.requestAnimationFrame(() => {
      const field = document.getElementById(targetId);
      field?.focus();
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const showValidationErrors = (fields: Record<string, string>) => {
    setValidationErrors(fields);
    setError('Please correct the highlighted fields and try again.');
    focusFirstInvalidField(fields);
  };

  const loadVerification = async (draft?: VerificationDraft) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    const result = await getEmployerVerification(token);
    if (!result.ok) {
      setError(result.error.message || 'We could not load your verification status.');
      setIsLoading(false);
      return;
    }

    const verification = result.data.data.verification;
    setStatus(verification.status ?? 'PENDING');
    setSubmittedAt(verification.submittedAt ?? null);
    setReviewedAt(verification.reviewedAt ?? null);
    setDeclineReason(verification.declineReason ?? null);
    setRegistrationNumber(draft?.registrationNumber ?? verification.registrationNumber ?? '');
    const savedRegistrationType = draft?.registrationType ?? verification.registrationType ?? 'CAC';
    const registrationTypeForm = draft
      ? { choice: draft.registrationTypeChoice, custom: draft.customRegistrationType }
      : getRegistrationTypeFormState(savedRegistrationType);
    setRegistrationType(savedRegistrationType);
    setRegistrationTypeChoice(registrationTypeForm.choice);
    setCustomRegistrationType(registrationTypeForm.custom);
    setDocuments(verification.documents ?? []);
    const savedCompany = draft?.company ?? verification.submittedCompany ?? emptyCompany;
    const industryForm = draft
      ? { choice: draft.industryChoice, custom: draft.customIndustry }
      : getIndustryFormState(savedCompany.industry);
    setCompany(savedCompany);
    setIndustryChoice(industryForm.choice);
    setCustomIndustry(industryForm.custom);
    setValidationErrors({});
    setIsLoading(false);
  };

  useEffect(() => {
    void loadVerification();
  }, [token]);

  const statusInfo = useMemo(() => {
    if (status === 'PENDING' && !submittedAt) {
      return { label: 'Unverified', tone: 'neutral' as const, icon: FaExclamationTriangle };
    }

    return statusMeta[status] ?? statusMeta.PENDING;
  }, [status, submittedAt]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !token) return;
    if (status === 'APPROVED' || (status === 'PENDING' && submittedAt)) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Please upload a PDF, JPG, PNG, or WEBP image that is 10 MB or smaller.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    const draft = createDraft();

    const result = await uploadEmployerVerificationDocument(file, selectedKind, token);
    if (!result.ok) {
      setError(result.error.message || 'We could not upload this document.');
    } else {
      setSuccess('Document uploaded successfully.');
      await loadVerification(draft);
    }

    setIsUploading(false);
  };

  const handleDelete = async (documentId: string) => {
    if (!token) return;
    if (status === 'APPROVED' || (status === 'PENDING' && submittedAt)) return;
    setIsDeleting(documentId);
    setError('');
    setSuccess('');
    const draft = createDraft();
    const result = await deleteEmployerVerificationDocument(documentId, token);
    if (!result.ok) {
      setError(result.error.message || 'This document could not be removed.');
    } else {
      setSuccess('Document removed.');
      await loadVerification(draft);
    }
    setIsDeleting(null);
  };

  const handleSubmit = async () => {
    if (!token || submitInFlight.current) return;

    const fields: Record<string, string> = {};
    if (!registrationNumber.trim()) {
      fields.registrationNumber = 'CAC, BN, or business registration number is required.';
    }
    if (!company.companyName?.trim()) {
      fields['company.companyName'] = 'Company name is required.';
    }
    if (registrationTypeChoice === 'OTHER' && !customRegistrationType.trim()) {
      fields.registrationType = 'Enter the business registration type.';
    }
    if ((registrationTypeChoice === 'OTHER' ? customRegistrationType : registrationTypeChoice).trim().length > 120) {
      fields.registrationType = 'Registration type must be 120 characters or fewer.';
    }
    if (industryChoice === 'Other' && !customIndustry.trim()) {
      fields['company.industry'] = 'Enter the company industry.';
    }
    if (industryChoice === 'Other' && customIndustry.trim().length > 120) {
      fields['company.industry'] = 'Industry must be 120 characters or fewer.';
    }

    const normalizedCompany: CompanyForm = { ...company };
    const urlFields = ['website', 'linkedinUrl', 'twitterUrl', 'facebookUrl'] as const;
    for (const field of urlFields) {
      const result = normalizeOptionalHttpUrl(company[field] ?? '');
      if (result.error) {
        fields[`company.${field}`] = result.error;
      } else {
        normalizedCompany[field] = result.value;
      }
    }

    if (Object.keys(fields).length > 0) {
      showValidationErrors(fields);
      return;
    }

    const normalizedRegistrationType = getRegistrationTypeSubmissionValue(registrationTypeChoice, customRegistrationType);
    const normalizedIndustry = getIndustrySubmissionValue(industryChoice, customIndustry);
    normalizedCompany.industry = normalizedIndustry;

    submitInFlight.current = true;
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setValidationErrors({});
    setCompany(normalizedCompany);
    setRegistrationType(normalizedRegistrationType);
    try {
      const result = await submitEmployerVerification({
        registrationNumber: registrationNumber.trim(),
        registrationType: normalizedRegistrationType,
        company: normalizedCompany,
      }, token);
      if (!result.ok) {
        const fieldErrors = getEmployerVerificationFieldErrors(result.error.fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
          showValidationErrors(fieldErrors);
        } else {
          const fallback = result.status === 400
            ? 'Please review your company details and try again.'
            : result.error.message || 'We could not submit your verification request.';
          setError(getEmployerVerificationFailureMessage(result.status, fallback));
        }
      } else {
        setSuccess('Verification submitted for review.');
        await loadVerification();
      }
    } finally {
      submitInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const visibleIndustryOptions = employerIndustries.filter((industry) => (
    !isIndustrySearchOpen || industry.toLowerCase().includes(industrySearch.toLowerCase())
  ));

  const selectIndustry = (choice: string) => {
    setIsIndustrySearchOpen(false);
    setIndustrySearch('');
    setActiveIndustryIndex(0);
    if (choice === 'Other') {
      const nextCustomIndustry = industryChoice === 'Other' ? customIndustry : '';
      setIndustryChoice('Other');
      setCustomIndustry(nextCustomIndustry);
      updateCompanyField('industry', nextCustomIndustry);
    } else {
      setIndustryChoice(choice);
      setCustomIndustry('');
      updateCompanyField('industry', choice);
    }
  };

  const handleIndustryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsIndustrySearchOpen(true);
      setActiveIndustryIndex((current) => Math.min(current + 1, visibleIndustryOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndustryIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && isIndustrySearchOpen && visibleIndustryOptions[activeIndustryIndex]) {
      event.preventDefault();
      selectIndustry(visibleIndustryOptions[activeIndustryIndex]);
    } else if (event.key === 'Escape') {
      setIsIndustrySearchOpen(false);
      setIndustrySearch('');
    }
  };

  const openDocument = async (documentId: string) => {
    if (!token) return;
    const result = await getEmployerVerificationDocument(documentId, token);
    if (!result.ok) {
      setError(result.error.message || 'This document could not be opened.');
      return;
    }

    const url = URL.createObjectURL(result.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const canEditDocuments = status !== 'APPROVED' && !(status === 'PENDING' && submittedAt);
  const canSubmit = documents.length > 0 && canEditDocuments;

  if (isLoading) {
    return (
      <div className="employer-page" aria-live="polite" aria-label="Loading employer verification">
        <section className="employer-hero employer-hero--compact">
          <div className="employer-hero__top">
            <div>
              <span className="employer-eyebrow">Verification</span>
              <h1>Company verification</h1>
              <p>Submit documents so your employer account can post jobs securely.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="employer-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Verification</span>
            <h1>Company verification</h1>
            <p>Submit business documents for review before your employer account can post jobs.</p>
          </div>
          <span className={`employer-status-badge employer-status-badge--${statusInfo.tone}`}>
            <statusInfo.icon />
            {statusInfo.label}
          </span>
        </div>
      </section>

      <main className="employer-content employer-verification-layout">
        <section className="employer-panel">
          <div className="employer-section-heading">
            <div>
              <h2>Submission status</h2>
              <p>We review your documents and confirm the account status.</p>
            </div>
          </div>

          {error ? (
            <div className="employer-form-message employer-form-message--error" role="alert" aria-live="assertive">
              <p>{error}</p>
              {Object.keys(validationErrors).length > 0 ? (
                <ul aria-label="Fields to review">
                  {Object.keys(validationErrors).map((field) => <li key={field}>{fieldLabel(field)}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
          {success ? <div className="employer-form-message employer-form-message--success" role="status" aria-live="polite">{success}</div> : null}

          <div className="employer-verification-summary">
            <div>
              <span>Current status</span>
              <strong>{statusInfo.label}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{formatDate(submittedAt)}</strong>
            </div>
            <div>
              <span>Reviewed</span>
              <strong>{formatDate(reviewedAt)}</strong>
            </div>
          </div>

          {status === 'APPROVED' ? (
            <div className="employer-verification-approved" role="status">
              <div className="employer-verification-approved__icon" aria-hidden="true">
                <FaCheckCircle />
              </div>
              <div className="employer-verification-approved__content">
                <span className="employer-verification-approved__eyebrow">Verified company</span>
                <h2>Your company is already verified</h2>
                <p>Your company has been approved by LeamJobs. You can now post opportunities and start hiring.</p>
                <button type="button" className="employer-button employer-button--primary" onClick={() => navigate('/employer/jobs')}>
                  <FaBriefcase /> Post a job and start hiring
                </button>
              </div>
            </div>
          ) : null}

          {declineReason ? (
            <div className="employer-verification-alert">
              <FaExclamationTriangle />
              <div>
                <strong>Review notes</strong>
                <p>{declineReason}</p>
              </div>
            </div>
          ) : null}

          {status !== 'APPROVED' ? <div className="employer-verification-upload">
            <div className="employer-verification-details-heading">
              <h3>Business details</h3>
              <p>Company name, registration type, and registration number are required. Other company details are optional.</p>
            </div>
            <div className="employer-verification-field-grid">
              <label htmlFor="verification-company-name">Company name
                <input id="verification-company-name" type="text" maxLength={160} value={company.companyName ?? ''} onChange={(event) => updateCompanyField('companyName', event.target.value)} disabled={!canEditDocuments} placeholder="Registered company name" required aria-invalid={Boolean(validationErrors['company.companyName'])} aria-describedby={validationErrors['company.companyName'] ? fieldErrorId('company.companyName') : undefined} />
                {renderFieldError('company.companyName')}
              </label>
              <div className="employer-verification-industry">
                <label htmlFor="verification-industry">Industry</label>
                <input
                  id="verification-industry"
                  type="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isIndustrySearchOpen}
                  aria-controls="verification-industry-options"
                  aria-activedescendant={isIndustrySearchOpen && visibleIndustryOptions.length > 0 ? `verification-industry-option-${activeIndustryIndex}` : undefined}
                  aria-invalid={Boolean(validationErrors['company.industry'])}
                  aria-describedby={validationErrors['company.industry'] ? `${fieldErrorId('company.industry')} verification-industry-hint` : 'verification-industry-hint'}
                  autoComplete="off"
                  value={isIndustrySearchOpen ? industrySearch : industryChoice}
                  onFocus={() => {
                    setIndustrySearch('');
                    setIsIndustrySearchOpen(true);
                    setActiveIndustryIndex(0);
                  }}
                  onBlur={() => window.setTimeout(() => setIsIndustrySearchOpen(false), 120)}
                  onChange={(event) => {
                    setIndustrySearch(event.target.value);
                    setIsIndustrySearchOpen(true);
                    setActiveIndustryIndex(0);
                  }}
                  onKeyDown={handleIndustryKeyDown}
                  disabled={!canEditDocuments}
                  placeholder="Search industries"
                />
                {isIndustrySearchOpen ? (
                  <div id="verification-industry-options" className="employer-verification-industry__options" role="listbox" aria-label="Industry options">
                    {visibleIndustryOptions.length > 0 ? visibleIndustryOptions.map((option, index) => (
                      <div
                        key={option}
                        id={`verification-industry-option-${index}`}
                        className={index === activeIndustryIndex ? 'is-active' : ''}
                        role="option"
                        aria-selected={industryChoice === option}
                        onPointerDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveIndustryIndex(index)}
                        onClick={() => selectIndustry(option)}
                      >
                        {option}
                      </div>
                    )) : <p className="employer-verification-industry__empty">No matching industries. Select Other to enter one.</p>}
                  </div>
                ) : null}
                <small id="verification-industry-hint">Search the list, or choose Other to enter a custom industry.</small>
                {renderFieldError('company.industry')}
                {industryChoice === 'Other' ? (
                  <label htmlFor="verification-industry-other">Other industry
                    <input id="verification-industry-other" type="text" maxLength={120} value={customIndustry} onChange={(event) => {
                      setCustomIndustry(event.target.value);
                      updateCompanyField('industry', event.target.value);
                    }} disabled={!canEditDocuments} placeholder="Enter your industry" required aria-invalid={Boolean(validationErrors['company.industry'])} aria-describedby={validationErrors['company.industry'] ? fieldErrorId('company.industry') : undefined} />
                  </label>
                ) : null}
              </div>
              <label htmlFor="registration-type">Business Registration Type (CAC Nigeria)
                <select id="registration-type" value={registrationTypeChoice} onChange={(event) => {
                  const choice = event.target.value as EmployerRegistrationTypeChoice;
                  setRegistrationTypeChoice(choice);
                  setCustomRegistrationType('');
                  setRegistrationType(choice);
                  clearFieldError('registrationType');
                }} disabled={!canEditDocuments} required aria-invalid={Boolean(validationErrors.registrationType)} aria-describedby={validationErrors.registrationType ? fieldErrorId('registrationType') : undefined}>
                  {employerRegistrationTypes.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                {renderFieldError('registrationType')}
                <small>Select the applicable registration category issued by Nigeria's Corporate Affairs Commission.</small>
              </label>
              {registrationTypeChoice === 'OTHER' ? (
                <label htmlFor="registration-type-other">Other registration type
                  <input id="registration-type-other" type="text" maxLength={120} value={customRegistrationType} onChange={(event) => {
                    setCustomRegistrationType(event.target.value);
                    setRegistrationType(event.target.value);
                    clearFieldError('registrationType');
                  }} disabled={!canEditDocuments} placeholder="Enter the registration type" required aria-invalid={Boolean(validationErrors.registrationType)} aria-describedby={validationErrors.registrationType ? fieldErrorId('registrationType') : undefined} />
                </label>
              ) : null}
              <label htmlFor="registration-number">Registration number
                <input id="registration-number" type="text" maxLength={120} value={registrationNumber} onChange={(event) => {
                  setRegistrationNumber(event.target.value);
                  clearFieldError('registrationNumber');
                }} disabled={!canEditDocuments} placeholder="CAC or BN registration number" required aria-invalid={Boolean(validationErrors.registrationNumber)} aria-describedby={validationErrors.registrationNumber ? fieldErrorId('registrationNumber') : undefined} />
                {renderFieldError('registrationNumber')}
              </label>
            </div>
            <label htmlFor="verification-description">About the company
              <textarea id="verification-description" rows={4} maxLength={5000} value={company.companyDescription ?? ''} onChange={(event) => updateCompanyField('companyDescription', event.target.value)} disabled={!canEditDocuments} placeholder="Describe what your company does" aria-invalid={Boolean(validationErrors['company.companyDescription'])} aria-describedby={validationErrors['company.companyDescription'] ? fieldErrorId('company.companyDescription') : undefined} />
              {renderFieldError('company.companyDescription')}
            </label>
            <div className="employer-verification-field-grid">
              {([
                { field: 'website', label: 'Website', placeholder: 'https://example.com' },
                { field: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/example' },
                { field: 'twitterUrl', label: 'X / Twitter URL', placeholder: 'https://x.com/example' },
                { field: 'facebookUrl', label: 'Facebook URL', placeholder: 'https://facebook.com/example' },
              ] as const).map(({ field, label, placeholder }) => (
                <label key={field} htmlFor={`verification-${field}`}>{label}
                  <input id={`verification-${field}`} type="url" inputMode="url" maxLength={500} value={company[field] ?? ''} onChange={(event) => updateCompanyField(field, event.target.value)} onBlur={() => {
                    const normalized = normalizeOptionalHttpUrl(company[field] ?? '');
                    if (normalized.error) {
                      const validationMessage = normalized.error;
                      setValidationErrors((current) => ({ ...current, [`company.${field}`]: validationMessage }));
                    } else {
                      updateCompanyField(field, normalized.value);
                    }
                  }} disabled={!canEditDocuments} placeholder={placeholder} aria-invalid={Boolean(validationErrors[`company.${field}`])} aria-describedby={validationErrors[`company.${field}`] ? `${fieldErrorId(`company.${field}`)} verification-url-hint-${field}` : `verification-url-hint-${field}`} />
                  <small id={`verification-url-hint-${field}`}>Optional. Enter a domain or a full http:// or https:// link. Paths are allowed.</small>
                  {renderFieldError(`company.${field}`)}
                </label>
              ))}
              {([
                { field: 'companySize', label: 'Company size', maxLength: 100 },
                { field: 'phoneNumber', label: 'Phone number', maxLength: 40 },
                { field: 'location', label: 'Location', maxLength: 160 },
                { field: 'address', label: 'Company address', maxLength: 240 },
                { field: 'state', label: 'State', maxLength: 120 },
                { field: 'country', label: 'Country', maxLength: 120 },
              ] as const).map(({ field, label, maxLength }) => (
                <label key={field} htmlFor={`verification-${field}`}>{label}
                  <input id={`verification-${field}`} type="text" maxLength={maxLength} value={company[field] ?? ''} onChange={(event) => updateCompanyField(field, event.target.value)} disabled={!canEditDocuments} aria-invalid={Boolean(validationErrors[`company.${field}`])} aria-describedby={validationErrors[`company.${field}`] ? fieldErrorId(`company.${field}`) : undefined} />
                  {renderFieldError(`company.${field}`)}
                </label>
              ))}
            </div>
            <div className="employer-verification-upload__heading">
              <div>
                <strong>Supporting document</strong>
                <small>Upload a clear document that matches your registration details.</small>
              </div>
              <FaFileAlt aria-hidden="true" />
            </div>
            <div className="employer-verification-upload__controls">
              <label htmlFor="verification-kind">Document type
                <select id="verification-kind" value={selectedKind} onChange={(event) => setSelectedKind(event.target.value as EmployerVerificationDocumentKind)} disabled={!canEditDocuments}>
                  {docKinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>{kind.label}</option>
                  ))}
                </select>
              </label>
              <label className="employer-upload-button" htmlFor="verification-file-input" aria-disabled={!canEditDocuments}>
                <FaUpload />
                {isUploading ? 'Uploading...' : 'Choose document'}
              </label>
              <input id="verification-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleUpload} disabled={isUploading || !canEditDocuments} />
            </div>
            <small className="employer-verification-upload__hint">Accepted: PDF, JPG, PNG, or WEBP. Maximum size 10 MB.</small>
          </div> : null}

          {status !== 'APPROVED' ? <div className="employer-verification-docs">
            {documents.length === 0 ? (
              <div className="employer-empty-state employer-empty-state--compact">
                <FaFileAlt />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              documents.map((document) => (
                <article key={document.id} className="employer-verification-doc">
                  <div>
                    <span>{document.kind}</span>
                    <strong>{document.fileName}</strong>
                    <small>Uploaded {formatDate(document.uploadedAt)}</small>
                  </div>
                  <div className="employer-verification-doc__actions">
                    <button type="button" className="employer-button employer-button--ghost" onClick={() => void openDocument(document.id)}>View</button>
                    <button type="button" className="employer-button employer-button--danger" disabled={isDeleting === document.id || !canEditDocuments} onClick={() => void handleDelete(document.id)}>
                      {isDeleting === document.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div> : null}
        </section>

        {status !== 'APPROVED' ? <aside className="employer-panel employer-verification-aside">
          <h2>Next steps</h2>
          <ul>
            <li>Upload clear company registration or identity documents.</li>
            <li>Keep a single valid document per category if you have multiple files.</li>
            <li>Once approved, your employer account may post jobs for review.</li>
          </ul>

          <button
            type="button"
            className="employer-button employer-button--primary"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : status === 'REJECTED' ? 'Resubmit for review' : 'Submit for review'}
          </button>
        </aside> : null}
      </main>
    </div>
  );
}

export default EmployerVerificationPage;
