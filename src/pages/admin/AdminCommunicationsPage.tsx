import { FormEvent, useEffect, useRef, useState } from "react";
import {
  FaBold,
  FaBullhorn,
  FaCheck,
  FaEye,
  FaHeading,
  FaSave,
  FaPaperPlane,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminCampaign,
  getAdminCampaignPreview,
  getAdminEmailTemplates,
  getAdminRecipientCount,
  previewAdminEmailTemplate,
  sendAdminCampaign,
  updateAdminCampaign,
  updateAdminEmailTemplate,
  type AdminCommunicationFields,
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
    </main>
  );
}

export default AdminCommunicationsPage;
