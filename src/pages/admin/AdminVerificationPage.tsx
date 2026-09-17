import { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaSearch,
  FaTimesCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  approveAdminVerification,
  getAdminVerificationDocument,
  getAdminVerificationSubmission,
  getAdminVerificationSubmissions,
  rejectAdminVerification,
  type EmployerVerificationDocument,
  type EmployerVerificationStatus,
  type EmployerVerificationSummary,
} from '../../services/api';

const statusMeta: Record<EmployerVerificationStatus, { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; icon: typeof FaClock }> = {
  PENDING: { label: 'Pending', tone: 'warning', icon: FaClock },
  APPROVED: { label: 'Approved', tone: 'success', icon: FaCheckCircle },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: FaTimesCircle },
};

function AdminVerificationPage() {
  const { token } = useAuth();
  const [list, setList] = useState<Array<{ id: string; status: EmployerVerificationStatus; submittedAt: string | null; reviewedAt: string | null; declineReason: string | null; submittedCompany: EmployerVerificationSummary['submittedCompany']; submittedCompanySource: EmployerVerificationSummary['submittedCompanySource']; employer: { id: string; email: string; firstName: string | null; lastName: string | null; companyName: string | null } | null; documentCount: number }>>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedVerification, setSelectedVerification] = useState<null | {
    id: string;
    status: EmployerVerificationStatus;
    reviewedAt: string | null;
    declineReason: string | null;
    registrationNumber: string | null;
    registrationType: 'CAC' | 'BN' | 'OTHER' | null;
    submittedCompany: EmployerVerificationSummary['submittedCompany'];
    submittedCompanySource: EmployerVerificationSummary['submittedCompanySource'];
    documents: EmployerVerificationDocument[];
    employer: { id: string; email: string; phone?: string | null; firstName: string | null; lastName: string | null; company: { companyName: string | null; companyDescription: string | null; website: string | null; industry: string | null; companySize: string | null; location: string | null; address: string | null; state: string | null; country: string | null; linkedinUrl: string | null; twitterUrl: string | null; facebookUrl: string | null; companyLogoUrl: string | null } | null } | null;
  }>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadList = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    const result = await getAdminVerificationSubmissions(token);
    if (!result.ok) {
      setError(result.error.message || 'We could not load verification submissions.');
      setIsLoading(false);
      return;
    }
    const nextList = result.data.data.verificationSubmissions ?? [];
    setList(nextList);
    if (!selectedId && nextList.length > 0) setSelectedId(nextList[0].id);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadList();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedId) {
      setSelectedVerification(null);
      return;
    }

    let active = true;
    setIsDetailLoading(true);
    setMessage('');
    setDecisionReason('');

    void getAdminVerificationSubmission(selectedId, token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load this verification request.');
        setSelectedVerification(null);
        setIsDetailLoading(false);
        return;
      }
      setSelectedVerification(result.data.data.verification);
      setError('');
      setIsDetailLoading(false);
    });

    return () => { active = false; };
  }, [selectedId, token]);

  const openDocument = async (documentId: string) => {
    if (!token) return;
    const result = await getAdminVerificationDocument(documentId, token);
    if (!result.ok) {
      setError(result.error.message || 'This document could not be opened.');
      return;
    }

    const url = URL.createObjectURL(result.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleApprove = async () => {
    if (!token || !selectedVerification || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setMessage('');
    const result = await approveAdminVerification(selectedVerification.id, token);
    if (!result.ok) {
      setError(result.error.message || 'Approval failed.');
    } else {
      setMessage('Verification approved.');
      await loadList();
      setSelectedId(result.data.data.verification.id);
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!token || !selectedVerification || isSubmitting) return;
    const trimmedReason = decisionReason.trim();
    if (!trimmedReason) {
      setError('A rejection reason is required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');
    const result = await rejectAdminVerification(selectedVerification.id, trimmedReason, token);
    if (!result.ok) {
      setError(result.error.message || 'Rejection failed.');
    } else {
      setMessage('Verification rejected.');
      await loadList();
      setSelectedId(result.data.data.verification.id);
    }
    setIsSubmitting(false);
  };

  const selectedStatusMeta = useMemo(() => selectedVerification ? statusMeta[selectedVerification.status] : statusMeta.PENDING, [selectedVerification]);
  const canDecide = selectedVerification?.status === 'PENDING';
  const companyForReview = selectedVerification?.submittedCompany
    ?? (selectedVerification?.submittedCompanySource === 'LEGACY_PROFILE_FALLBACK' ? selectedVerification.employer?.company : null);

  if (isLoading) {
    return <div className="admin-page admin-empty-state"><strong>Loading verification queue…</strong></div>;
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Company verification</span>
          <h1>Review employer submissions</h1>
          <p>Assess submitted company documents, approve valid employers, and request corrections for rejected submissions.</p>
        </div>
        <button type="button" className="admin-icon-button" aria-label="Search verification submissions">
          <FaSearch />
        </button>
      </section>

      <div className="admin-moderation-layout">
        <aside className="admin-moderation-list">
          {list.length === 0 ? (
            <div className="admin-empty-state"><strong>No verification requests</strong><p>New employer verification submissions will appear here.</p></div>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-moderation-item ${selectedId === item.id ? 'admin-moderation-item--active' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div>
                  <strong>{item.submittedCompany?.companyName || (item.submittedCompanySource === 'LEGACY_PROFILE_FALLBACK' ? item.employer?.companyName : null) || 'Company not set'}</strong>
                  {item.submittedCompanySource === 'LEGACY_PROFILE_FALLBACK' ? <small>Legacy profile data</small> : null}
                  <small>{item.employer ? `${item.employer.firstName ?? ''} ${item.employer.lastName ?? ''}`.trim() || item.employer.email : item.id}</small>
                </div>
                <span className={`admin-pill admin-pill--${statusMeta[item.status].tone}`}>{statusMeta[item.status].label}</span>
              </button>
            ))
          )}
        </aside>

        <main className="admin-moderation-detail">
          {error ? <div className="admin-form-message admin-form-message--error">{error}</div> : null}
          {message ? <div className="admin-form-message admin-form-message--success">{message}</div> : null}

          {isDetailLoading ? <div className="admin-empty-state"><strong>Loading submission…</strong></div> : !selectedVerification ? (
            <div className="admin-empty-state"><strong>No submission selected</strong><p>Select a verification request to review.</p></div>
          ) : (
            <>
              <div className="admin-review-header">
                <div>
                  <span className="admin-eyebrow">Submitted for verification</span>
                  <h2>{companyForReview?.companyName || selectedVerification.employer?.email || 'Employer verification'}</h2>
                  <p className="admin-review-header__meta">{selectedVerification.employer?.email || 'No employer email'} · {selectedVerification.registrationType || 'Registration'} {selectedVerification.registrationNumber || 'number not provided'}</p>
                </div>
                <span className={`admin-pill admin-pill--${selectedStatusMeta.tone}`}>
                  <selectedStatusMeta.icon />
                  {selectedStatusMeta.label}
                </span>
              </div>

              <div className="admin-review-grid">
                <section className="admin-review-section">
                  <h3>Submitted company details</h3>
                  <dl className="admin-review-facts">
                    <div><dt>Contact</dt><dd>{selectedVerification.employer?.email || 'Unknown'}</dd></div>
                    <div><dt>Phone</dt><dd>{selectedVerification.employer?.phone || 'Not provided'}</dd></div>
                    <div><dt>Website</dt><dd>{companyForReview?.website || 'Not provided'}</dd></div>
                    <div><dt>Location</dt><dd>{companyForReview?.location || 'Not provided'}</dd></div>
                    <div><dt>Address</dt><dd>{companyForReview?.address || 'Not provided'}</dd></div>
                    <div><dt>State / country</dt><dd>{[companyForReview?.state, companyForReview?.country].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
                  </dl>
                </section>
                <section className="admin-review-section">
                  <h3>Submitted business profile</h3>
                  <dl className="admin-review-facts">
                    <div><dt>Industry</dt><dd>{companyForReview?.industry || 'Not provided'}</dd></div>
                    <div><dt>Company size</dt><dd>{companyForReview?.companySize || 'Not provided'}</dd></div>
                  </dl>
                  <p className="admin-review-description">{companyForReview?.companyDescription || 'No company description provided.'}</p>
                  {selectedVerification.submittedCompanySource !== 'SUBMITTED' ? <p className="admin-review-header__meta">Legacy record: company details are from the current public profile because no submitted snapshot was stored.</p> : null}
                </section>
              </div>

              <section className="admin-review-section admin-verification-docs">
                <div className="admin-review-section__heading"><div><h3>Submitted documents</h3><p>Open each document to verify the employer details.</p></div><span>{selectedVerification.documents.length} attached</span></div>
                {selectedVerification.documents.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state--compact"><FaFileAlt /><p>No documents attached.</p></div>
                ) : (
                  selectedVerification.documents.map((document) => (
                    <article key={document.id} className="admin-verification-doc">
                      <div>
                        <strong>{document.fileName}</strong>
                        <small>{document.kind}</small>
                      </div>
                      <button type="button" className="admin-review-action admin-review-action--ghost" onClick={() => void openDocument(document.id)}>Open</button>
                    </article>
                  ))
                )}
              </section>

              <div className={`admin-review-action-block ${!canDecide ? 'admin-review-action-block--closed' : ''}`}>
                <div className="admin-review-section__heading"><div><h3>Decision</h3><p>{canDecide ? 'Approve this submission or reject it with a clear reason.' : `This submission is already ${selectedStatusMeta.label.toLowerCase()}.`}</p></div></div>
                <label htmlFor="verification-rejection-reason">Rejection reason</label>
                <textarea
                  id="verification-rejection-reason"
                  rows={4}
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  placeholder="Required only when rejecting a submission"
                  disabled={!canDecide || isSubmitting}
                />
                <div className="admin-review-actions">
                  <button type="button" className="admin-review-action admin-review-action--approve" disabled={!canDecide || isSubmitting} onClick={() => void handleApprove()}>
                    {isSubmitting ? 'Processing…' : 'Approve'}
                  </button>
                  <button type="button" className="admin-review-action admin-review-action--reject" disabled={!canDecide || isSubmitting} onClick={() => void handleReject()}>
                    Reject
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminVerificationPage;
