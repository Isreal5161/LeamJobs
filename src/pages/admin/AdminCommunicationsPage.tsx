import { FormEvent, useEffect, useRef, useState } from "react";
import {
  FaBold,
  FaBullhorn,
  FaCheck,
  FaEye,
  FaHeading,
  FaHistory,
  FaSave,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminCampaign,
  getAdminCampaignPreview,
  getAdminCampaignDeliveries,
  getAdminCampaignReport,
  getAdminCampaignRecords,
  getAdminEmailTemplates,
  getAdminRecipientCount,
  previewAdminEmailTemplate,
  sendAdminCampaign,
  updateAdminCampaign,
  updateAdminEmailTemplate,
  type AdminCommunicationFields,
  type AdminCampaignDelivery,
  type AdminCampaignRecord,
  type AdminEmailTemplate,
} from "../../services/api";

type Editor = AdminCommunicationFields & {
  key: string;
  name: string;
  isActive: boolean;
};
const blankCampaign: AdminCommunicationFields = {
  subject: "",
  heading: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
  segment: "ALL_MARKETING_USERS",
};

const audienceLabels: Record<string, string> = {
  ALL_MARKETING_USERS: "All opted-in registered users",
  SEEKERS: "Opted-in seekers",
  EMPLOYERS: "Opted-in employers",
  PUBLIC_JOB_SUBSCRIBERS: "Public job-update subscribers",
};

const reportStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  SENT: "Sent",
  PARTIALLY_FAILED: "Partially failed",
  FAILED: "Failed",
};

const formatCampaignDate = (value: string | null) => value ? new Date(value).toLocaleString() : "Not available";

function AdminCommunicationsPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<AdminEmailTemplate[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [campaign, setCampaign] =
    useState<AdminCommunicationFields>(blankCampaign);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignPreview, setCampaignPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);
  const [pendingSend, setPendingSend] = useState<{
    id: string;
    count: number;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [campaignRecords, setCampaignRecords] = useState<AdminCampaignRecord[]>([]);
  const [campaignRecordsLoading, setCampaignRecordsLoading] = useState(true);
  const [campaignRecordsError, setCampaignRecordsError] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaignRecord | null>(null);
  const [campaignDeliveries, setCampaignDeliveries] = useState<AdminCampaignDelivery[]>([]);
  const [campaignReportLoading, setCampaignReportLoading] = useState(false);
  const [campaignReportError, setCampaignReportError] = useState("");
  const [campaignReportPreview, setCampaignReportPreview] = useState<{ subject: string; html: string } | null>(null);
  const campaignBodyRef = useRef<HTMLTextAreaElement>(null);

  const loadTemplates = async () => {
    if (!token) return;
    setTemplatesLoading(true);
    const result = await getAdminEmailTemplates(token);
    if (result.ok) setTemplates(result.data.data.templates);
    else setError(result.error.message || "Unable to load email templates.");
    setTemplatesLoading(false);
  };
  useEffect(() => {
    void loadTemplates();
  }, [token]);

  const loadCampaignRecords = async () => {
    if (!token) return;
    setCampaignRecordsLoading(true);
    setCampaignRecordsError("");
    const result = await getAdminCampaignRecords(token);
    if (result.ok) setCampaignRecords(result.data.data.records);
    else setCampaignRecordsError(result.error.message || "Unable to load campaign records.");
    setCampaignRecordsLoading(false);
  };

  useEffect(() => {
    void loadCampaignRecords();
  }, [token]);

  const editTemplate = (template: AdminEmailTemplate) => {
    setEditor({ ...template });
    setPreview(null);
    setNotice("");
    setError("");
  };
  const updateField = (field: keyof Editor, value: string | boolean) =>
    setEditor((current) =>
      current ? { ...current, [field]: value } : current,
    );
  const saveTemplate = async () => {
    if (!token || !editor) return;
    setSaving(true);
    setNotice("");
    setError("");
    const result = await updateAdminEmailTemplate(token, editor.key, editor);
    if (result.ok) {
      setTemplates((current) =>
        current.map((item) =>
          item.key === editor.key ? result.data.data.template : item,
        ),
      );
      setNotice("Template saved.");
    } else setError(result.error.message || "Unable to save template.");
    setSaving(false);
  };
  const previewTemplate = async () => {
    if (!token || !editor) return;
    const result = await previewAdminEmailTemplate(token, editor.key, editor);
    if (result.ok)
      setPreview({
        subject: result.data.data.subject,
        html: result.data.data.html,
      });
    else setError(result.error.message || "Unable to render preview.");
  };
  const updateCampaign = (
    field: keyof AdminCommunicationFields,
    value: string,
  ) => {
    setCampaign((current) => ({ ...current, [field]: value }));
    setRecipientCount(null);
  };
  const formatCampaignBody = (format: "heading" | "bold") => {
    const textarea = campaignBodyRef.current;
    const value = campaign.body ?? "";
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const selected = value.slice(start, end);
    let nextValue = value;
    let nextStart = start;
    let nextEnd = end;

    if (format === "heading") {
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      nextValue = `${value.slice(0, lineStart)}## ${value.slice(lineStart)}`;
      nextStart = start + 3;
      nextEnd = end + 3;
    } else {
      const content = selected || "text";
      nextValue = `${value.slice(0, start)}**${content}**${value.slice(end)}`;
      nextStart = start + 2;
      nextEnd = nextStart + content.length;
    }

    updateCampaign("body", nextValue);
    window.requestAnimationFrame(() => {
      campaignBodyRef.current?.focus();
      campaignBodyRef.current?.setSelectionRange(nextStart, nextEnd);
    });
  };
  const checkRecipients = async () => {
    if (!token || !campaign.segment) return;
    const result = await getAdminRecipientCount(
      token,
      campaign.segment || "ALL_MARKETING_USERS",
    );
    if (result.ok) setRecipientCount(result.data.data.recipientCount);
    else
      setError(
        result.error.message || "Unable to calculate eligible recipients.",
      );
  };
  useEffect(() => {
    void checkRecipients();
  }, [token, campaign.segment]);
  useEffect(() => {
    if (!editor && !pendingSend) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        setEditor(null);
        setPendingSend(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, pendingSend, saving]);
  const createDraft = async () => {
    if (!token) return null;
    const result = await createAdminCampaign(token, campaign);
    if (!result.ok) {
      setError(result.error.message || "Unable to create campaign.");
      return null;
    }
    setCampaignId(result.data.data.campaign.id);
    return result.data.data.campaign.id;
  };
  const previewCampaign = async () => {
    const id = campaignId ?? (await createDraft());
    if (!token || !id) return;
    if (campaignId) {
      const updated = await updateAdminCampaign(token, id, campaign);
      if (!updated.ok) {
        setError(updated.error.message || "Unable to update campaign draft.");
        return;
      }
    }
    const result = await getAdminCampaignPreview(token, id);
    if (result.ok) {
      setCampaignPreview({
        subject: result.data.data.subject,
        html: result.data.data.html,
      });
      setRecipientCount(result.data.data.recipientCount);
    } else
      setError(result.error.message || "Unable to render campaign preview.");
  };
  const openCampaignReport = async (record: AdminCampaignRecord) => {
    if (!token) return;
    setSelectedCampaign(record);
    setCampaignDeliveries([]);
    setCampaignReportPreview(null);
    setCampaignReportError("");
    setCampaignReportLoading(true);
    const [reportResult, deliveriesResult] = await Promise.all([
      getAdminCampaignReport(token, record.campaign.id),
      getAdminCampaignDeliveries(token, record.campaign.id),
    ]);
    if (reportResult.ok) setSelectedCampaign(reportResult.data.data);
    else setCampaignReportError(reportResult.error.message || "Unable to load campaign report.");
    if (deliveriesResult.ok) setCampaignDeliveries(deliveriesResult.data.data.deliveries);
    else setCampaignReportError(deliveriesResult.error.message || "Unable to load delivery records.");
    setCampaignReportLoading(false);
  };
  const loadCampaignReportPreview = async () => {
    if (!token || !selectedCampaign) return;
    const result = await getAdminCampaignPreview(token, selectedCampaign.campaign.id);
    if (result.ok) setCampaignReportPreview({ subject: result.data.data.subject, html: result.data.data.html });
    else setCampaignReportError(result.error.message || "Unable to render campaign preview.");
  };
  const sendCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setNotice("");
    const id = campaignId ?? (await createDraft());
    if (!id) {
      setSaving(false);
      return;
    }
    if (campaignId) {
      const updated = await updateAdminCampaign(token, id, campaign);
      if (!updated.ok) {
        setError(updated.error.message || "Unable to update campaign draft.");
        setSaving(false);
        return;
      }
    }
    const countResult = await getAdminRecipientCount(
      token,
      campaign.segment || "ALL_MARKETING_USERS",
    );
    const count = countResult.ok
      ? countResult.data.data.recipientCount
      : (recipientCount ?? 0);
    if (!count) {
      setSaving(false);
      return;
    }
    setPendingSend({ id, count });
    setSaving(false);
  };
  const confirmSend = async () => {
    if (!token || !pendingSend) return;
    setSaving(true);
    setError("");
    setNotice("");
    const sent = await sendAdminCampaign(token, pendingSend.id);
    if (sent.ok) {
      setNotice(
        `Campaign queued for ${pendingSend.count.toLocaleString()} eligible recipients.`,
      );
      setCampaign(blankCampaign);
      setCampaignId(null);
      setCampaignPreview(null);
      setRecipientCount(pendingSend.count);
      setPendingSend(null);
      void loadCampaignRecords();
    } else setError(sent.error.message || "Unable to queue campaign.");
    setSaving(false);
  };

  return (
    <main className="admin-communications-page">
      <header className="admin-communications-hero">
        <span>
          <FaBullhorn /> Admin communications
        </span>
        <h1>Communications</h1>
        <p>
          Manage system welcome emails and approved promotional messages through
          the shared LeamJobs delivery system.
        </p>
      </header>
      {notice ? (
        <div className="admin-communications-notice" role="status">
          <FaCheck /> {notice}
        </div>
      ) : null}
      {pendingSend ? (
        <div
          className="admin-communications-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-confirmation-title"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setPendingSend(null); }}
        >
          <div className="admin-communications-modal__panel admin-communications-confirmation">
            <div className="admin-communications-modal__header">
              <div>
                <span className="admin-eyebrow">Confirm promotion</span>
                <h2 id="send-confirmation-title">Ready to send?</h2>
              </div>
              <button
                type="button"
                onClick={() => setPendingSend(null)}
                aria-label="Cancel send"
              >
                Cancel
              </button>
            </div>
            {error ? <div className="admin-communications-error" role="alert">{error}</div> : null}
            <p>
              You are about to send this promotional email to {pendingSend.count.toLocaleString()} eligible recipients.
            </p>
            <div className="admin-communications-modal__actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setPendingSend(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-button admin-button--primary"
                disabled={saving}
                onClick={() => void confirmSend()}
              >
                <FaPaperPlane /> Confirm send
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="admin-communications-error" role="alert">
          {error}
        </div>
      ) : null}
      <section className="admin-communications-section">
        <div className="admin-communications-section__heading">
          <div>
            <span className="admin-eyebrow">System-triggered</span>
            <h2>Welcome emails</h2>
            <p>
              These emails are sent automatically after successful registration.
              There is no manual send action.
            </p>
          </div>
        </div>
        {templatesLoading ? <div className="admin-communications-template-grid" aria-label="Loading welcome templates" aria-busy="true">{[1, 2].map((item) => <div className="admin-communications-card admin-communications-card--skeleton" key={item}><span /><span /><span /></div>)}</div> : <div className="admin-communications-template-grid">
          {templates.map((template) => (
            <article className="admin-communications-card" key={template.key}>
              <div>
                <span className="admin-communications-card__status">
                  {template.isActive ? "Active" : "Disabled"}
                </span>
                <h3>{template.name}</h3>
                <p>{template.subject}</p>
                <small>
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </small>
              </div>
              <button type="button" onClick={() => editTemplate(template)}>
                <FaEye /> Edit &amp; preview
              </button>
            </article>
          ))}
        </div>}
      </section>
      <section className="admin-communications-section">
        <div className="admin-communications-section__heading">
          <div>
            <span className="admin-eyebrow">
              Explicit confirmation required
            </span>
            <h2>Promotional emails</h2>
            <p>
              Only recipients with active marketing consent are eligible.
              Transactional email rules are separate.
            </p>
          </div>
        </div>
        <form
          className="admin-communications-campaign"
          onSubmit={(event) => void sendCampaign(event)}
        >
          <label>
            Subject
            <input
              value={campaign.subject}
              onChange={(event) =>
                updateCampaign("subject", event.target.value)
              }
              required
            />
          </label>
          <label>
            Heading
            <input
              value={campaign.heading}
              onChange={(event) =>
                updateCampaign("heading", event.target.value)
              }
              required
            />
          </label>
          <label>
            Message
            <div className="admin-communications-editor-toolbar" role="toolbar" aria-label="Message formatting">
              <button
                type="button"
                className="admin-editor-tool"
                onClick={() => formatCampaignBody("heading")}
                title="Add heading"
                aria-label="Add heading"
              >
                <FaHeading aria-hidden="true" /> Heading
              </button>
              <button
                type="button"
                className="admin-editor-tool"
                onClick={() => formatCampaignBody("bold")}
                title="Bold selected text"
                aria-label="Bold selected text"
              >
                <FaBold aria-hidden="true" /> Bold
              </button>
            </div>
            <textarea
              ref={campaignBodyRef}
              value={campaign.body}
              onChange={(event) => updateCampaign("body", event.target.value)}
              rows={5}
              required
            />
          </label>
          <div className="admin-communications-form-grid">
            <label>
              CTA text
              <input
                value={campaign.ctaLabel ?? ""}
                onChange={(event) =>
                  updateCampaign("ctaLabel", event.target.value)
                }
              />
            </label>
            <label>
              CTA URL
              <input
                value={campaign.ctaUrl ?? ""}
                onChange={(event) =>
                  updateCampaign("ctaUrl", event.target.value)
                }
                placeholder="/seeker/jobs"
              />
            </label>
          </div>
          <label>
            Recipient segment
            <select
              value={campaign.segment}
              onChange={(event) =>
                updateCampaign("segment", event.target.value)
              }
            >
              <option value="ALL_MARKETING_USERS">
                All opted-in registered users
              </option>
              <option value="SEEKERS">Opted-in seekers</option>
              <option value="EMPLOYERS">Opted-in employers</option>
              <option value="PUBLIC_JOB_SUBSCRIBERS">
                Subscribed public job-update visitors
              </option>
            </select>
          </label>
          <div className="admin-communications-campaign__actions">
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={() => void checkRecipients()}
            >
              <FaEye /> Check eligible recipients
            </button>
            <span>
              {recipientCount === null
                ? "Recipient count not checked"
                : `${recipientCount.toLocaleString()} eligible recipients`}
            </span>
            <button
              type="submit"
              className="admin-button admin-button--primary"
              disabled={saving}
            >
              <FaPaperPlane /> {saving ? "Queueing..." : "Send promotion"}
            </button>
          </div>
        </form>
      </section>
      <section className="admin-communications-section" aria-labelledby="campaign-records-title">
        <div className="admin-communications-section__heading">
          <div>
            <span className="admin-eyebrow"><FaHistory /> Campaign history</span>
            <h2 id="campaign-records-title">Campaign records</h2>
            <p>Review queued campaigns and the actual delivery-worker results for each recipient.</p>
          </div>
        </div>
        {campaignRecordsLoading ? (
          <div className="admin-communications-records-state" aria-busy="true">Loading campaign records...</div>
        ) : campaignRecordsError ? (
          <div className="admin-communications-error" role="alert">{campaignRecordsError}</div>
        ) : campaignRecords.length === 0 ? (
          <div className="admin-communications-records-state">No promotional campaigns have been created yet.</div>
        ) : (
          <div className="admin-communications-records-list">
            {campaignRecords.map((record) => (
              <article className="admin-communications-record" key={record.campaign.id}>
                <div className="admin-communications-record__main">
                  <div className="admin-communications-record__title-row">
                    <h3>{record.campaign.subject}</h3>
                    <span className={`admin-communications-status admin-communications-status--${record.delivery.reportingStatus.toLowerCase()}`}>
                      {reportStatusLabels[record.delivery.reportingStatus]}
                    </span>
                  </div>
                  <p>{audienceLabels[record.campaign.segment] || record.campaign.segment}</p>
                  <small>Created {formatCampaignDate(record.campaign.createdAt)}</small>
                </div>
                <div className="admin-communications-record__counts" aria-label="Campaign delivery counts">
                  <span><strong>{record.delivery.recipientCount}</strong> recipients</span>
                  <span><strong>{record.delivery.sent}</strong> sent</span>
                  <span><strong>{record.delivery.pending + record.delivery.processing}</strong> active</span>
                  <span><strong>{record.delivery.failed}</strong> failed</span>
                </div>
                <button type="button" className="admin-button admin-button--secondary" onClick={() => void openCampaignReport(record)}>
                  <FaEye /> View report
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      {editor ? (
        <div
          className="admin-communications-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-editor-title"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditor(null); }}
        >
          <div className="admin-communications-modal__panel">
            <div className="admin-communications-modal__header">
              <div>
                <span className="admin-eyebrow">System template</span>
                <h2 id="template-editor-title">{editor.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                aria-label="Close template editor"
              >
                ×
              </button>
            </div>
            {error ? <div className="admin-communications-error" role="alert">{error}</div> : null}
            <div className="admin-communications-form-grid">
              <label>
                Subject
                <input
                  value={editor.subject}
                  onChange={(event) =>
                    updateField("subject", event.target.value)
                  }
                />
              </label>
              <label>
                Heading
                <input
                  value={editor.heading}
                  onChange={(event) =>
                    updateField("heading", event.target.value)
                  }
                />
              </label>
            </div>
            <label>
              Message
              <textarea
                value={editor.body}
                onChange={(event) => updateField("body", event.target.value)}
                rows={6}
              />
            </label>
            <div className="admin-communications-form-grid">
              <label>
                CTA text
                <input
                  value={editor.ctaLabel ?? ""}
                  onChange={(event) =>
                    updateField("ctaLabel", event.target.value)
                  }
                />
              </label>
              <label>
                CTA URL
                <input
                  value={editor.ctaUrl ?? ""}
                  onChange={(event) =>
                    updateField("ctaUrl", event.target.value)
                  }
                />
              </label>
            </div>
            <label className="admin-communications-checkbox">
              <input
                type="checkbox"
                checked={editor.isActive}
                onChange={(event) =>
                  updateField("isActive", event.target.checked)
                }
              />{" "}
              Active for future registrations
            </label>
            {preview ? (
              <div className="admin-communications-preview">
                <strong>{preview.subject}</strong>
                <iframe title="Email preview" srcDoc={preview.html} />
              </div>
            ) : null}
            <div className="admin-communications-modal__actions">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => void previewTemplate()}
              >
                <FaEye /> Preview
              </button>
              <button
                type="button"
                className="admin-button admin-button--primary"
                disabled={saving}
                onClick={() => void saveTemplate()}
              >
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {selectedCampaign ? (
        <div className="admin-communications-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-report-title">
          <div className="admin-communications-modal__panel admin-communications-report-panel">
            <div className="admin-communications-modal__header">
              <div>
                <span className="admin-eyebrow">Campaign report</span>
                <h2 id="campaign-report-title">{selectedCampaign.campaign.subject}</h2>
              </div>
              <button type="button" onClick={() => setSelectedCampaign(null)} aria-label="Close campaign report"><FaTimes /></button>
            </div>
            {campaignReportLoading ? <div className="admin-communications-records-state">Loading report...</div> : null}
            {campaignReportError ? <div className="admin-communications-error" role="alert">{campaignReportError}</div> : null}
            {!campaignReportLoading ? (
              <>
                <div className="admin-communications-report-meta">
                  <span><strong>Audience</strong>{audienceLabels[selectedCampaign.campaign.segment] || selectedCampaign.campaign.segment}</span>
                  <span><strong>Created</strong>{formatCampaignDate(selectedCampaign.campaign.createdAt)}</span>
                  <span><strong>Queued</strong>{formatCampaignDate(selectedCampaign.campaign.sentAt)}</span>
                  <span><strong>State</strong><em className={`admin-communications-status admin-communications-status--${selectedCampaign.delivery.reportingStatus.toLowerCase()}`}>{reportStatusLabels[selectedCampaign.delivery.reportingStatus]}</em></span>
                </div>
                <div className="admin-communications-report-counts">
                  <div><strong>{selectedCampaign.delivery.recipientCount}</strong><span>Recipients</span></div>
                  <div><strong>{selectedCampaign.delivery.sent}</strong><span>Sent</span></div>
                  <div><strong>{selectedCampaign.delivery.pending}</strong><span>Pending</span></div>
                  <div><strong>{selectedCampaign.delivery.processing}</strong><span>Processing</span></div>
                  <div><strong>{selectedCampaign.delivery.failed}</strong><span>Failed</span></div>
                </div>
                <div className="admin-communications-report-content">
                  <h3>Original content</h3>
                  <dl>
                    <dt>Subject</dt><dd>{selectedCampaign.campaign.subject}</dd>
                    <dt>Heading</dt><dd>{selectedCampaign.campaign.heading}</dd>
                    <dt>Message</dt><dd className="admin-communications-report-body">{selectedCampaign.campaign.body}</dd>
                    <dt>CTA label</dt><dd>{selectedCampaign.campaign.ctaLabel || "None"}</dd>
                    <dt>CTA URL</dt><dd>{selectedCampaign.campaign.ctaUrl || "None"}</dd>
                  </dl>
                  <button type="button" className="admin-button admin-button--secondary" onClick={() => void loadCampaignReportPreview()}>
                    <FaEye /> {campaignReportPreview ? "Refresh preview" : "Preview email"}
                  </button>
                  {campaignReportPreview ? <div className="admin-communications-preview"><strong>{campaignReportPreview.subject}</strong><iframe title="Campaign email preview" srcDoc={campaignReportPreview.html} /></div> : null}
                </div>
                <div className="admin-communications-report-content">
                  <h3>Recipient deliveries</h3>
                  {campaignDeliveries.length === 0 ? <p className="admin-communications-records-state">No delivery records are available for this campaign.</p> : (
                    <div className="admin-communications-delivery-table-wrap">
                      <table className="admin-communications-delivery-table">
                        <thead><tr><th>Recipient</th><th>Status</th><th>Attempts</th><th>Created</th><th>Sent</th><th>Failure</th></tr></thead>
                        <tbody>{campaignDeliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.recipientEmail}</td><td><span className={`admin-communications-status admin-communications-status--${delivery.status.toLowerCase()}`}>{delivery.status}</span></td><td>{delivery.attempts}</td><td>{formatCampaignDate(delivery.createdAt)}</td><td>{formatCampaignDate(delivery.sentAt)}</td><td>{delivery.lastError || "-"}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default AdminCommunicationsPage;
