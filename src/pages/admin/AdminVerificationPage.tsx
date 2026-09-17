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
} from '../../services/api';

const statusMeta: Record<EmployerVerificationStatus, { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; icon: typeof FaClock }> = {
  PENDING: { label: 'Pending', tone: 'warning', icon: FaClock },
  APPROVED: { label: 'Approved', tone: 'success', icon: FaCheckCircle },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: FaTimesCircle },
};

function AdminVerificationPage() {
  const { token } = useAuth();
  const [list, setList] = useState<Array<{ id: string; status: EmployerVerificationStatus; submittedAt: string | null; reviewedAt: string | null; declineReason: string | null; employer: { id: string; email: string; firstName: string | null; lastName: string | null; companyName: string | null } | null; documentCount: number }>>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedVerification, setSelectedVerification] = useState<null | {
    id: string;
    status: EmployerVerificationStatus;
    reviewedAt: string | null;
    declineReason: string | null;
    registrationNumber: string | null;
    registrationType: 'CAC' | 'BN' | 'OTHER' | null;
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
                  <strong>{item.employer?.companyName || 'Company not set'}</strong>
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
                  <span className="admin-eyebrow">Submission</span>
                  <h2>{selectedVerification.employer?.company?.companyName || selectedVerification.employer?.email || 'Employer verification'}</h2>
                </div>
                <span className={`admin-pill admin-pill--${selectedStatusMeta.tone}`}>
                  <selectedStatusMeta.icon />
                  {selectedStatusMeta.label}
                </span>
              </div>

              <div className="admin-review-grid">
                <div>
                  <p><strong>Contact:</strong> {selectedVerification.employer?.email || 'Unknown'}</p>
                  <p><strong>Phone:</strong> {selectedVerification.employer?.phone || 'Not provided'}</p>
                  <p><strong>Company:</strong> {selectedVerification.employer?.company?.companyName || 'Not provided'}</p>
                  <p><strong>Registration:</strong> {selectedVerification.registrationType || 'Not provided'} {selectedVerification.registrationNumber || ''}</p>
                  <p><strong>Website:</strong> {selectedVerification.employer?.company?.website || 'Not provided'}</p>
                  <p><strong>Location:</strong> {selectedVerification.employer?.company?.location || 'Not provided'}</p>
                  <p><strong>Address:</strong> {selectedVerification.employer?.company?.address || 'Not provided'}</p>
                  <p><strong>State / country:</strong> {[selectedVerification.employer?.company?.state, selectedVerification.employer?.company?.country].filter(Boolean).join(', ') || 'Not provided'}</p>
                </div>
                <div>
                  <p><strong>Industry:</strong> {selectedVerification.employer?.company?.industry || 'Not provided'}</p>
                  <p><strong>Company size:</strong> {selectedVerification.employer?.company?.companySize || 'Not provided'}</p>
                  <p><strong>Description:</strong> {selectedVerification.employer?.company?.companyDescription || 'Not provided'}</p>
                  <p><strong>Social links:</strong> {[selectedVerification.employer?.company?.linkedinUrl, selectedVerification.employer?.company?.twitterUrl, selectedVerification.employer?.company?.facebookUrl].filter(Boolean).join(', ') || 'Not provided'}</p>
                </div>
              </div>

              <div className="admin-verification-docs">
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
              </div>

              <div className="admin-review-action-block">
                <label htmlFor="verification-rejection-reason">Rejection reason</label>
                <textarea
                  id="verification-rejection-reason"
                  rows={4}
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  placeholder="Required only when rejecting a submission"
                />
                <div className="admin-review-actions">
                  <button type="button" className="admin-review-action admin-review-action--approve" disabled={isSubmitting} onClick={() => void handleApprove()}>
                    {isSubmitting ? 'Processing…' : 'Approve'}
                  </button>
                  <button type="button" className="admin-review-action admin-review-action--reject" disabled={isSubmitting} onClick={() => void handleReject()}>
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
