import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaCheckCircle, FaSpinner, FaTimes } from 'react-icons/fa';
import {
  createEmployerInterview,
  rescheduleEmployerInterview,
  type InterviewMethod,
  type InterviewRecord,
  type InterviewSchedulePayload,
} from '../../services/api';

type InterviewScheduleModalProps = {
  token: string;
  application: {
    id: string;
    jobId: string;
    job: { title: string };
    applicant: { firstName: string; lastName: string; fullName: string };
  };
  existingInterview?: InterviewRecord;
  onClose: () => void;
  onComplete: (interview: InterviewRecord) => void;
};

const methods: Array<{ value: InterviewMethod; label: string }> = [
  { value: 'LEAMJOBS', label: 'LeamJobs Messages' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'VIDEO', label: 'Video meeting' },
  { value: 'PHONE', label: 'Phone call' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'OTHER', label: 'Other' },
];

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
const localToday = (() => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
})();
const timezoneOptions = (() => {
  const intlWithTimeZones = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  const zones = intlWithTimeZones.supportedValuesOf?.('timeZone') ?? ['Africa/Lagos', 'Etc/UTC', 'Europe/London', 'America/New_York'];
  return [...new Set([browserTimeZone, ...zones])].sort((first, second) => first.localeCompare(second));
})();

const getLocalSchedule = (value: string, timeZone: string) => {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
  };
};

function InterviewScheduleModal({ token, application, existingInterview, onClose, onComplete }: InterviewScheduleModalProps) {
  const initialSchedule = existingInterview ? getLocalSchedule(existingInterview.scheduledAt, existingInterview.timezone) : { date: '', time: '' };
  const [method, setMethod] = useState<InterviewMethod>(existingInterview?.method ?? 'LEAMJOBS');
  const [localDate, setLocalDate] = useState(initialSchedule.date);
  const [localTime, setLocalTime] = useState(initialSchedule.time);
  const [timezone, setTimezone] = useState(existingInterview?.timezone ?? browserTimeZone);
  const [duration, setDuration] = useState(existingInterview?.durationMinutes?.toString() ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(existingInterview?.whatsappNumber ?? '');
  const [phoneNumber, setPhoneNumber] = useState(existingInterview?.phoneNumber ?? '');
  const [meetingUrl, setMeetingUrl] = useState(existingInterview?.meetingUrl ?? '');
  const [location, setLocation] = useState(existingInterview?.location ?? '');
  const [message, setMessage] = useState(existingInterview?.message ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedInterview, setSavedInterview] = useState<InterviewRecord | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeHandlerRef = useRef(onClose);
  const submittingRef = useRef(submitting);
  const isReschedule = Boolean(existingInterview);
  closeHandlerRef.current = onClose;
  submittingRef.current = submitting;

  const methodHint = useMemo(() => {
    switch (method) {
      case 'LEAMJOBS': return 'The conversation will take place in your LeamJobs Messages inbox.';
      case 'WHATSAPP': return 'Enter the WhatsApp number the seeker should contact.';
      case 'VIDEO': return 'Provide a secure HTTP or HTTPS meeting link.';
      case 'PHONE': return 'Enter the phone number the seeker should call.';
      case 'IN_PERSON': return 'Provide the full interview address.';
      case 'OTHER': return 'Describe how and where the interview will take place.';
    }
  }, [method]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handleKeys = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) {
        closeHandlerRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = event.currentTarget as HTMLElement;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const dialog = document.querySelector<HTMLElement>('.interview-modal');
    dialog?.addEventListener('keydown', handleKeys);
    return () => {
      dialog?.removeEventListener('keydown', handleKeys);
      previousFocusRef.current?.focus();
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !localDate || !localTime || !timezone) return;
    setSubmitting(true);
    setError('');
    const payload: InterviewSchedulePayload = {
      localDate,
      localTime,
      timezone,
      method,
      ...(duration ? { durationMinutes: Number(duration) } : {}),
      ...(method === 'WHATSAPP' ? { phoneNumber: whatsappNumber.trim() } : {}),
      ...(method === 'VIDEO' ? { meetingUrl: meetingUrl.trim() } : {}),
      ...(method === 'PHONE' ? { phoneNumber: phoneNumber.trim() } : {}),
      ...(method === 'IN_PERSON' ? { location: location.trim() } : {}),
      ...(method === 'OTHER' ? { location: location.trim() } : {}),
      ...(message.trim() ? { message: message.trim() } : {}),
    };
    const result = isReschedule && existingInterview
      ? await rescheduleEmployerInterview(existingInterview.id, payload, token)
      : await createEmployerInterview(application.jobId, application.id, payload, token);
    if (!result.ok) {
      setError(result.error.message || 'We could not save this interview. Review the details and try again.');
      setSubmitting(false);
      return;
    }
    const interview = result.data.data.interview;
    setSavedInterview(interview);
    setSubmitting(false);
    onComplete(interview);
  };

  const applicantName = application.applicant.fullName || `${application.applicant.firstName} ${application.applicant.lastName}`.trim();

  return (
    <div className="interview-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section className="interview-modal" role="dialog" aria-modal="true" aria-labelledby="interview-modal-title" aria-describedby="interview-modal-description">
        <header className="interview-modal__header">
          <div>
            <span className="employer-eyebrow">{isReschedule ? 'Update interview' : 'Candidate invitation'}</span>
            <h2 id="interview-modal-title">{savedInterview ? (isReschedule ? 'Interview rescheduled' : 'Invitation sent') : (isReschedule ? 'Reschedule Interview' : 'Schedule Interview')}</h2>
          </div>
          <button ref={closeRef} className="employer-icon-button" type="button" aria-label="Close interview scheduling" onClick={onClose} disabled={submitting}><FaTimes /></button>
        </header>

        {savedInterview ? (
          <div className="interview-modal__success" role="status">
            <FaCheckCircle aria-hidden="true" />
            <div>
              <strong>{applicantName}</strong>
              <p>{application.job.title}</p>
              <p>{new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short', timeZone: savedInterview.timezone }).format(new Date(savedInterview.scheduledAt))} · {savedInterview.timezone}</p>
              <p>{methods.find((item) => item.value === savedInterview.method)?.label}</p>
            </div>
            <footer>
              <button className="employer-button employer-button--ghost" type="button" onClick={onClose}>Close</button>
              <Link className="employer-button employer-button--primary" to="/employer/interviews">View interviews</Link>
            </footer>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)}>
            <p id="interview-modal-description" className="interview-modal__intro">
              Invite <strong>{applicantName}</strong> to interview for <strong>{application.job.title}</strong>.
            </p>
            <div className="interview-form-grid">
              <label className="interview-field interview-field--full">
                <span>Interview method</span>
                <select value={method} onChange={(event) => setMethod(methods.find((item) => item.value === event.target.value)?.value ?? 'LEAMJOBS')}>
                  {methods.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
                <small>{methodHint}</small>
              </label>
              <label className="interview-field">
                <span>Date</span>
                <input type="date" value={localDate} min={localToday} onChange={(event) => setLocalDate(event.target.value)} required />
              </label>
              <label className="interview-field">
                <span>Time</span>
                <input type="time" value={localTime} onChange={(event) => setLocalTime(event.target.value)} required />
              </label>
              <label className="interview-field interview-field--full">
                <span>Timezone</span>
                <select value={timezone} onChange={(event) => setTimezone(event.target.value)} required>
                  {!timezoneOptions.includes(timezone) ? <option value={timezone}>{timezone}</option> : null}
                  {timezoneOptions.map((zone) => <option value={zone} key={zone}>{zone.replaceAll('_', ' ')}</option>)}
                </select>
              </label>
              <label className="interview-field">
                <span>Duration <small>(optional)</small></span>
                <input type="number" min="1" max="1440" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Minutes" />
              </label>
              {method === 'WHATSAPP' ? <label className="interview-field"><span>WhatsApp number</span><input type="tel" value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} autoComplete="tel" required /></label> : null}
              {method === 'PHONE' ? <label className="interview-field"><span>Phone number</span><input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} autoComplete="tel" required /></label> : null}
              {method === 'VIDEO' ? <label className="interview-field interview-field--full"><span>Meeting link</span><input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://" required /></label> : null}
              {method === 'IN_PERSON' ? <label className="interview-field interview-field--full"><span>Location / address</span><input type="text" value={location} onChange={(event) => setLocation(event.target.value)} required /></label> : null}
              {method === 'OTHER' ? <label className="interview-field interview-field--full"><span>Location or instructions</span><input type="text" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="How should the seeker join?" required /></label> : null}
              <label className="interview-field interview-field--full">
                <span>Message / instructions <small>(optional)</small></span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={3000} placeholder="Share context or anything the candidate should prepare." />
              </label>
            </div>
            {error ? <p className="interview-feedback interview-feedback--error" role="alert">{error}</p> : null}
            <footer className="interview-modal__footer">
              <button className="employer-button employer-button--ghost" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
              <button className="employer-button employer-button--primary" type="submit" disabled={submitting || !localDate || !localTime}>
                {submitting ? <FaSpinner className="leamjobs-spin" aria-hidden="true" /> : <FaCalendarAlt aria-hidden="true" />}
                {submitting ? 'Sending invitation…' : isReschedule ? 'Save new schedule' : 'Send Interview Invitation'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}

export default InterviewScheduleModal;
