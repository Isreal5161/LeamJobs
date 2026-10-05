import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaClock, FaComments, FaExternalLinkAlt, FaMapMarkerAlt, FaPhone, FaRedo, FaSpinner, FaTimes, FaWhatsapp } from 'react-icons/fa';
import InterviewScheduleModal from '../../components/interviews/InterviewScheduleModal';
import { useAuth } from '../../context/AuthContext';
import {
  cancelEmployerInterview,
  getEmployerInterview,
  getEmployerInterviews,
  getSeekerInterview,
  getSeekerInterviews,
  type InterviewMethod,
  type InterviewRecord,
} from '../../services/api';

type InterviewsPageProps = {
  role: 'employer' | 'seeker';
};

const safeInternalPath = (value: string | null | undefined) => value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
  ? value
  : '/seeker/messages';

const methodLabels: Record<InterviewMethod, string> = {
  LEAMJOBS: 'LeamJobs Messages',
  WHATSAPP: 'WhatsApp',
  VIDEO: 'Video meeting',
  PHONE: 'Phone call',
  IN_PERSON: 'In person',
  OTHER: 'Other',
};

const formatSchedule = (interview: InterviewRecord, style: 'full' | 'compact' = 'full') => {
  const date = new Date(interview.scheduledAt);
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable';
  return new Intl.DateTimeFormat(undefined, style === 'full'
    ? { dateStyle: 'full', timeStyle: 'short', timeZone: interview.timezone }
    : { dateStyle: 'medium', timeStyle: 'short', timeZone: interview.timezone }).format(date);
};

const jobTitle = (interview: InterviewRecord) => interview.job?.title ?? interview.application?.jobTitle ?? 'Interview';
const jobId = (interview: InterviewRecord) => interview.job?.id ?? interview.application?.jobId ?? interview.jobId ?? '';

const personName = (interview: InterviewRecord, role: 'employer' | 'seeker') => {
  if (role === 'employer') {
    const applicant = interview.applicant ?? interview.application?.applicant ?? interview.application?.seeker ?? interview.seeker;
    return applicant?.fullName || [applicant?.firstName, applicant?.lastName].filter(Boolean).join(' ').trim() || 'Applicant';
  }
  const employer = interview.employer ?? interview.application?.employer;
  return employer?.companyName || [employer?.firstName, employer?.lastName].filter(Boolean).join(' ').trim() || interview.companyName || interview.application?.companyName || 'Employer';
};

const isSafeHttpUrl = (value: string | null | undefined): value is string => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const statusLabel = (status: InterviewRecord['status']) => status === 'SCHEDULED' ? 'Scheduled' : status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const displayStatusLabel = (interview: InterviewRecord) => interview.status === 'SCHEDULED' && interview.events?.some((event) => event.eventType === 'RESCHEDULED') ? 'Rescheduled' : statusLabel(interview.status);

function InterviewsPage({ role }: InterviewsPageProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(Boolean(interviewId));
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filter, setFilter] = useState<'UPCOMING' | 'ALL' | 'CANCELLED'>('UPCOMING');
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const basePath = `/${role}/interviews`;

  useEffect(() => {
    if (!cancelDialogOpen) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('.interview-cancel-dialog');
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])') ?? [])];
    focusable()[0]?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !isCancelling) {
        setCancelDialogOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements[elements.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) {
        event.preventDefault();
        elements[0].focus();
      }
    };
    dialog?.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [cancelDialogOpen, isCancelling]);

  const loadInterviews = useCallback(async () => {
    if (!token) {
      setError('Your session could not be loaded. Please sign in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const result = role === 'employer'
      ? await getEmployerInterviews(token, page)
      : await getSeekerInterviews(token, page);
    if (!result.ok) {
      setError(result.error.message || 'We could not load your interviews.');
    } else {
      setInterviews((current) => page === 1 ? result.data.data.interviews : [...current, ...result.data.data.interviews.filter((interview) => !current.some((item) => item.id === interview.id))]);
      setHasNextPage(Boolean(result.data.data.pagination?.hasNextPage));
    }
    setLoading(false);
  }, [page, role, token]);

  useEffect(() => {
    void loadInterviews();
  }, [loadInterviews, retryKey]);

  const loadDetail = useCallback(async () => {
    if (!interviewId || !token) {
      setSelectedInterview(null);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    const result = role === 'employer'
      ? await getEmployerInterview(interviewId, token)
      : await getSeekerInterview(interviewId, token);
    if (!result.ok) {
      setDetailError(result.error.message || 'We could not load this interview.');
      setSelectedInterview(null);
    } else {
      setSelectedInterview(result.data.data.interview);
    }
    setDetailLoading(false);
  }, [interviewId, role, token]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail, retryKey]);

  const filteredInterviews = useMemo(() => interviews.filter((interview) => {
    if (filter === 'ALL') return true;
    if (filter === 'CANCELLED') return interview.status === 'CANCELLED';
    return interview.status === 'SCHEDULED' && new Date(interview.scheduledAt).getTime() >= Date.now();
  }), [filter, interviews]);

  const updateInterview = (interview: InterviewRecord) => {
    setInterviews((current) => [interview, ...current.filter((item) => item.id !== interview.id)]);
    setSelectedInterview(interview);
    setRescheduling(false);
    setRetryKey((value) => value + 1);
  };

  const submitCancellation = async () => {
    if (!token || !selectedInterview || isCancelling || selectedInterview.status !== 'SCHEDULED') return;
    setIsCancelling(true);
    setCancelError('');
    const result = await cancelEmployerInterview(selectedInterview.id, cancelReason.trim(), token);
    if (!result.ok) {
      setCancelError(result.error.message || 'We could not cancel this interview.');
    } else {
      updateInterview(result.data.data.interview);
      setCancelDialogOpen(false);
      setCancelReason('');
    }
    setIsCancelling(false);
  };

  const interview = selectedInterview;
  const active = interview?.status === 'SCHEDULED' && new Date(interview.scheduledAt).getTime() >= Date.now();
  const rawWhatsApp = interview?.whatsappNumber?.replace(/\D/g, '') ?? '';
  const whatsappUrl = isSafeHttpUrl(interview?.whatsappUrl)
    ? interview.whatsappUrl
    : rawWhatsApp ? `https://wa.me/${rawWhatsApp}` : null;
  const actionLink = role === 'seeker' ? safeInternalPath(interview?.messageUrl) : null;

  return (
    <main className="interviews-page">
      <header className="interviews-page__header">
        <div>
          <span className="employer-eyebrow">{role === 'employer' ? 'Candidate management' : 'Your applications'}</span>
          <h1>{role === 'employer' ? 'Interviews' : 'Interview Invitations'}</h1>
          <p>{role === 'employer' ? 'Manage upcoming and past interviews with your applicants.' : 'Review invitations and get ready for your upcoming interviews.'}</p>
        </div>
      </header>

      <div className={`interviews-layout ${interviewId ? 'interviews-layout--detail' : ''}`}>
        <section className="interviews-list-panel" aria-label="Interview list">
          <div className="interviews-filters" aria-label="Filter interviews">
            {(['UPCOMING', 'ALL', 'CANCELLED'] as const).map((item) => (
              <button type="button" key={item} className={filter === item ? 'interviews-filter interviews-filter--active' : 'interviews-filter'} aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item === 'UPCOMING' ? 'Upcoming' : item === 'ALL' ? 'All' : 'Cancelled'}
              </button>
            ))}
          </div>
          {error ? <div className="interviews-state interviews-state--error" role="alert"><strong>Interviews unavailable</strong><p>{error}</p><button type="button" className="employer-button employer-button--ghost" onClick={() => setRetryKey((value) => value + 1)}>Try again</button></div> : null}
          {loading ? <div className="interviews-skeletons" aria-busy="true" aria-label="Loading interviews" role="status">{[1, 2, 3].map((item) => <div className="interview-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}</div> : null}
          {!loading && !error && filteredInterviews.length === 0 ? <div className="interviews-state"><FaCalendarAlt aria-hidden="true" /><strong>No interviews to show</strong><p>{filter === 'UPCOMING' ? 'Upcoming interviews will appear here once scheduled.' : 'There are no interviews in this category yet.'}</p></div> : null}
          {!loading && !error ? <div className="interviews-list">
            {filteredInterviews.map((item) => (
              <Link className={`interview-list-card ${item.status === 'CANCELLED' ? 'interview-list-card--cancelled' : ''}`} to={`${basePath}/${item.id}`} key={item.id} aria-current={interviewId === item.id ? 'page' : undefined}>
                <div className="interview-list-card__top">
                  <span className={`interview-status interview-status--${item.status.toLowerCase()}`}>{displayStatusLabel(item)}</span>
                  <span className="interview-list-card__method">{methodLabels[item.method]}</span>
                </div>
                <h2>{personName(item, role)}</h2>
                <p>{jobTitle(item)}</p>
                <div className="interview-list-card__schedule"><FaCalendarAlt aria-hidden="true" /><span>{formatSchedule(item, 'compact')} <small>{item.timezone}</small></span></div>
              </Link>
            ))}
          </div> : null}
          {!loading && hasNextPage && !error ? <button className="employer-button employer-button--ghost interviews-load-more" type="button" onClick={() => setPage((value) => value + 1)}><FaRedo aria-hidden="true" /> Load more</button> : null}
        </section>

        <section className="interview-detail-panel" aria-label="Interview details" aria-live="polite">
          {interviewId ? <Link className="interviews-back-link" to={basePath}><FaArrowLeft aria-hidden="true" /> Back to interviews</Link> : null}
          {!interviewId ? <div className="interviews-detail-placeholder"><FaCalendarAlt aria-hidden="true" /><strong>Select an interview</strong><p>Choose an interview from the list to see its details and available actions.</p></div> : null}
          {detailLoading ? <div className="interviews-state" role="status" aria-live="polite"><FaSpinner className="leamjobs-spin" /> Loading interview…</div> : null}
          {!detailLoading && detailError ? <div className="interviews-state interviews-state--error" role="alert"><strong>Interview unavailable</strong><p>{detailError}</p><button className="employer-button employer-button--ghost" type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button></div> : null}
          {!detailLoading && !detailError && interview ? (
            <article className="interview-detail">
              <header className="interview-detail__header">
                <div>
                  <span className={`interview-status interview-status--${interview.status.toLowerCase()}`}>{displayStatusLabel(interview)}</span>
                  <h2>{role === 'employer' ? personName(interview, role) : jobTitle(interview)}</h2>
                  <p>{role === 'employer' ? jobTitle(interview) : personName(interview, role)}</p>
                </div>
                <span className="interview-detail__method">{methodLabels[interview.method]}</span>
              </header>
              <section className="interview-detail__facts" aria-label="Schedule">
                <div><FaCalendarAlt aria-hidden="true" /><span><small>Date and time</small><strong>{formatSchedule(interview)}</strong></span></div>
                <div><FaClock aria-hidden="true" /><span><small>Timezone</small><strong>{interview.timezone}</strong></span></div>
                {interview.durationMinutes ? <div><FaClock aria-hidden="true" /><span><small>Duration</small><strong>{interview.durationMinutes} minutes</strong></span></div> : null}
                {interview.location ? <div><FaMapMarkerAlt aria-hidden="true" /><span><small>Location</small><strong>{interview.location}</strong></span></div> : null}
              </section>
              {interview.message ? <section className="interview-detail__message"><h3>{role === 'seeker' ? 'Message from the employer' : 'Instructions shared with the applicant'}</h3><p>{interview.message}</p></section> : null}
              {interview.status === 'CANCELLED' ? <div className="interview-cancelled-note" role="status"><FaTimes aria-hidden="true" /><div><strong>This interview was cancelled</strong>{interview.cancellationReason || interview.events?.find((event) => event.eventType === 'CANCELLED')?.reason ? <p>{interview.cancellationReason || interview.events?.find((event) => event.eventType === 'CANCELLED')?.reason}</p> : null}</div></div> : null}
              {role === 'seeker' && active ? <section className="interview-detail__actions" aria-label="Join interview">
                <h3>Interview action</h3>
                {interview.method === 'LEAMJOBS' ? <Link className="employer-button employer-button--primary" to={actionLink || '/seeker/messages'}><FaComments aria-hidden="true" /> Open LeamJobs Messages</Link> : null}
                {interview.method === 'WHATSAPP' && whatsappUrl ? <a className="employer-button employer-button--primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" /> Open WhatsApp</a> : null}
                {interview.method === 'VIDEO' && isSafeHttpUrl(interview.meetingUrl) ? <a className="employer-button employer-button--primary" href={interview.meetingUrl} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt aria-hidden="true" /> Join interview</a> : null}
                {interview.method === 'PHONE' && interview.phoneNumber ? <a className="employer-button employer-button--primary" href={`tel:${interview.phoneNumber.replace(/[^\d+]/g, '')}`}><FaPhone aria-hidden="true" /> Call</a> : null}
                {interview.method === 'IN_PERSON' && interview.location ? <a className="employer-button employer-button--primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(interview.location)}`} target="_blank" rel="noopener noreferrer"><FaMapMarkerAlt aria-hidden="true" /> View location</a> : null}
                {interview.method === 'OTHER' ? <>
                  {isSafeHttpUrl(interview.meetingUrl) ? <a className="employer-button employer-button--primary" href={interview.meetingUrl} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt aria-hidden="true" /> Open interview link</a> : null}
                  {interview.otherContactNumber ? <a className="employer-button employer-button--primary" href={`tel:${interview.otherContactNumber.replace(/[^\d+]/g, '')}`}><FaPhone aria-hidden="true" /> Call contact</a> : null}
                  {!interview.meetingUrl && !interview.otherContactNumber && !interview.location ? <p>Follow the instructions above to attend this interview.</p> : null}
                </> : null}
              </section> : null}
              {role === 'employer' && active ? <section className="interview-detail__actions">
                <h3>Manage interview</h3>
                <div className="interview-detail__employer-actions">
                  <button className="employer-button employer-button--primary" type="button" onClick={() => setRescheduling(true)}><FaRedo aria-hidden="true" /> Reschedule</button>
                  <button className="employer-button employer-button--ghost" type="button" onClick={() => { setCancelDialogOpen(true); setCancelError(''); }}><FaTimes aria-hidden="true" /> Cancel interview</button>
                </div>
              </section> : null}
            </article>
          ) : null}
        </section>
      </div>

      {rescheduling && interview ? <InterviewScheduleModal
        token={token ?? ''}
        application={{
          id: interview.applicationId,
          jobId: jobId(interview),
          job: { title: jobTitle(interview) },
          applicant: {
            firstName: interview.applicant?.firstName ?? interview.seeker?.firstName ?? interview.application?.applicant?.firstName ?? interview.application?.seeker?.firstName ?? '',
            lastName: interview.applicant?.lastName ?? interview.seeker?.lastName ?? interview.application?.applicant?.lastName ?? interview.application?.seeker?.lastName ?? '',
            fullName: personName(interview, 'employer'),
          },
        }}
        existingInterview={interview}
        onClose={() => setRescheduling(false)}
        onComplete={updateInterview}
      /> : null}

      {cancelDialogOpen && interview ? <div className="interview-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isCancelling) setCancelDialogOpen(false); }}>
        <section className="interview-modal interview-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="interview-cancel-title">
          <header className="interview-modal__header"><div><span className="employer-eyebrow">Employer action</span><h2 id="interview-cancel-title">Cancel this interview?</h2></div><button type="button" className="employer-icon-button" aria-label="Close cancellation dialog" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}><FaTimes /></button></header>
          <p>The seeker will be notified that this interview has been cancelled.</p>
          <label className="interview-field"><span>Reason <small>(optional)</small></span><textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} maxLength={1000} /></label>
          {cancelError ? <p className="interview-feedback interview-feedback--error" role="alert">{cancelError}</p> : null}
          <footer className="interview-modal__footer"><button className="employer-button employer-button--ghost" type="button" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>Keep interview</button><button className="employer-button employer-button--danger" type="button" onClick={() => void submitCancellation()} disabled={isCancelling}>{isCancelling ? <FaSpinner className="leamjobs-spin" /> : <FaCheck />}{isCancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></footer>
        </section>
      </div> : null}
    </main>
  );
}

export default InterviewsPage;
