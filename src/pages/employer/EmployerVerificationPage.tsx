import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
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
  companyName: '', companyDescription: '', website: '', industry: '', companySize: '', location: '', address: '', state: '', country: '', linkedinUrl: '', twitterUrl: '', facebookUrl: '',
};

function EmployerVerificationPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<EmployerVerificationStatus>('PENDING');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationType, setRegistrationType] = useState<'CAC' | 'BN' | 'OTHER'>('CAC');
  const [documents, setDocuments] = useState<Array<{ id: string; kind: EmployerVerificationDocumentKind; fileName: string; uploadedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedKind, setSelectedKind] = useState<EmployerVerificationDocumentKind>('CAC');
  const [company, setCompany] = useState<CompanyForm>(emptyCompany);

  const loadVerification = async () => {
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
    setRegistrationNumber(verification.registrationNumber ?? '');
    setRegistrationType(verification.registrationType ?? 'CAC');
    setDocuments(verification.documents ?? []);
    setCompany(verification.submittedCompany ?? emptyCompany);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadVerification();
  }, [token]);

  const statusInfo = useMemo(() => statusMeta[status] ?? statusMeta.PENDING, [status]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !token) return;
    if (status === 'APPROVED' || (status === 'PENDING' && submittedAt)) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Please upload a PDF, JPG, PNG, or WEBP image under 10 MB.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    const result = await uploadEmployerVerificationDocument(file, selectedKind, token);
    if (!result.ok) {
      setError(result.error.message || 'We could not upload this document.');
    } else {
      setSuccess('Document uploaded successfully.');
      await loadVerification();
    }

    setIsUploading(false);
  };

  const handleDelete = async (documentId: string) => {
    if (!token) return;
    if (status === 'APPROVED' || (status === 'PENDING' && submittedAt)) return;
    setIsDeleting(documentId);
    setError('');
    setSuccess('');
    const result = await deleteEmployerVerificationDocument(documentId, token);
    if (!result.ok) {
      setError(result.error.message || 'This document could not be removed.');
    } else {
      setSuccess('Document removed.');
      await loadVerification();
    }
    setIsDeleting(null);
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!registrationNumber.trim()) {
      setError('CAC, BN, or business registration number is required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    const result = await submitEmployerVerification({ registrationNumber: registrationNumber.trim(), registrationType, company }, token);
    if (!result.ok) {
      setError(result.error.message || 'We could not submit your verification request.');
    } else {
      setSuccess('Verification submitted for review.');
      await loadVerification();
    }
    setIsSubmitting(false);
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

          {error ? <div className="employer-form-message employer-form-message--error">{error}</div> : null}
          {success ? <div className="employer-form-message employer-form-message--success">{success}</div> : null}

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
            <div className="employer-verification-field-grid">
              <label htmlFor="verification-company-name">Company name
                <input id="verification-company-name" type="text" maxLength={160} value={company.companyName ?? ''} onChange={(event) => setCompany((current) => ({ ...current, companyName: event.target.value }))} disabled={!canEditDocuments} placeholder="Registered company name" />
              </label>
              <label htmlFor="verification-industry">Industry
                <input id="verification-industry" type="text" maxLength={120} value={company.industry ?? ''} onChange={(event) => setCompany((current) => ({ ...current, industry: event.target.value }))} disabled={!canEditDocuments} placeholder="e.g. Digital technology" />
              </label>
              <label htmlFor="registration-type">Registration type
                <select id="registration-type" value={registrationType} onChange={(event) => setRegistrationType(event.target.value as 'CAC' | 'BN' | 'OTHER')} disabled={!canEditDocuments}>
                  <option value="CAC">CAC</option>
                  <option value="BN">Business name (BN)</option>
                  <option value="OTHER">Other registration</option>
                </select>
              </label>
              <label htmlFor="registration-number">Registration number
                <input id="registration-number" type="text" maxLength={120} value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} disabled={!canEditDocuments} placeholder="CAC or BN registration number" />
              </label>
            </div>
            <label htmlFor="verification-description">About the company
              <textarea id="verification-description" rows={4} maxLength={5000} value={company.companyDescription ?? ''} onChange={(event) => setCompany((current) => ({ ...current, companyDescription: event.target.value }))} disabled={!canEditDocuments} placeholder="Describe what your company does" />
            </label>
            <div className="employer-verification-field-grid">
              {(['website', 'linkedinUrl', 'twitterUrl', 'facebookUrl', 'companySize', 'location', 'address', 'state', 'country'] as const).map((field) => (
                <label key={field} htmlFor={`verification-${field}`}>{field === 'linkedinUrl' ? 'LinkedIn URL' : field === 'twitterUrl' ? 'X / Twitter URL' : field === 'facebookUrl' ? 'Facebook URL' : field.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())}
                  <input id={`verification-${field}`} type="text" value={company[field] ?? ''} onChange={(event) => setCompany((current) => ({ ...current, [field]: event.target.value }))} disabled={!canEditDocuments} />
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
          >
            {isSubmitting ? 'Submitting…' : status === 'REJECTED' ? 'Resubmit for review' : 'Submit for review'}
          </button>
        </aside> : null}
      </main>
    </div>
  );
}

export default EmployerVerificationPage;
