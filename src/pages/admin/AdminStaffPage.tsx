import { type FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowLeft,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaEye,
  FaFilter,
  FaHistory,
  FaKey,
  FaPlus,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaUserCheck,
  FaUserPlus,
  FaUserSlash,
  FaUsers,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminStaffInvitation,
  getAdminStaff,
  getAdminStaffAudit,
  getAdminStaffDetails,
  getAdminStaffInvitations,
  getAdminStaffPermissions,
  reactivateAdminStaff,
  resendAdminStaffInvitation,
  revokeAdminStaffInvitation,
  suspendAdminStaff,
  updateAdminStaffPermissions,
  type AdminStaffAuditEvent,
  type AdminStaffDetails,
  type AdminStaffInvitation,
  type AdminStaffMember,
  type AdminStaffPage,
  type AdminStaffPermission,
} from '../../services/api';

type DialogKind = 'invite' | 'details' | 'permissions' | 'audit' | 'action' | null;
type StaffAction = 'resend' | 'revoke' | 'suspend' | 'reactivate';
type Notice = { tone: 'success' | 'error'; message: string };

const PAGE_SIZE = 20;

const dateLabel = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const dateTimeLabel = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const moduleLabel = (value: string) => value
  .replace(/[._-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const invitationStatus = (invitation: AdminStaffInvitation) => {
  if (invitation.acceptedAt) return 'Accepted';
  if (invitation.revokedAt) return 'Revoked';
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return 'Expired';
  return 'Pending';
};

const staffStatus = (staff: AdminStaffMember | AdminStaffDetails) => (
  staff.suspendedAt
    || ('adminAccount' in staff && staff.adminAccount.suspendedAt)
    || !staff.isActive
    ? 'Suspended'
    : 'Active'
);

const groupByModule = <T extends { module: string }>(items: T[]) => items.reduce<Record<string, T[]>>((groups, item) => {
  (groups[item.module] ??= []).push(item);
  return groups;
}, {});

const auditActionLabel: Record<string, string> = {
  ADMIN_INVITATION_CREATED: 'Invitation created',
  ADMIN_INVITATION_RESENT: 'Invitation resent',
  ADMIN_INVITATION_REVOKED: 'Invitation revoked',
  ADMIN_INVITATION_ACCEPTED: 'Invitation accepted',
  STAFF_PERMISSION_GRANTED: 'Permission granted',
  STAFF_PERMISSION_REVOKED: 'Permission revoked',
  STAFF_SUSPENDED: 'Administrator suspended',
  STAFF_REACTIVATED: 'Administrator reactivated',
};

function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
  busy = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  busy?: boolean;
}) {
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalRef.current?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')?.focus();
    return () => previousFocus?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    );
    if (!focusable?.length) return;
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

  return (
    <div
      className="admin-staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={`admin-staff-modal ${wide ? 'admin-staff-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-staff-modal-title"
        aria-describedby={description ? 'admin-staff-modal-description' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="admin-staff-modal__header">
          <div>
            <h2 id="admin-staff-modal-title">{title}</h2>
            {description ? <p id="admin-staff-modal-description">{description}</p> : null}
          </div>
          <button type="button" className="admin-staff-icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function PageControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="admin-staff-pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <FaChevronLeft aria-hidden="true" /> Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        Next <FaChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}

function AdminStaffPage() {
  const { token, user } = useAuth();
  const [staffResult, setStaffResult] = useState<AdminStaffPage<AdminStaffMember> | null>(null);
  const [invitationResult, setInvitationResult] = useState<AdminStaffPage<AdminStaffInvitation> | null>(null);
  const [permissions, setPermissions] = useState<AdminStaffPermission[]>([]);
  const [staffPage, setStaffPage] = useState(1);
  const [invitationPage, setInvitationPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'staff' | 'invitations'>('staff');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [permissionFilter, setPermissionFilter] = useState('');
  const [invitationFilter, setInvitationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedInvitation, setSelectedInvitation] = useState<AdminStaffInvitation | null>(null);
  const [staffDetails, setStaffDetails] = useState<AdminStaffDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [permissionSelection, setPermissionSelection] = useState<string[]>([]);
  const [permissionStep, setPermissionStep] = useState<'edit' | 'review'>('edit');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSelection, setInviteSelection] = useState<string[]>([]);
  const [inviteStep, setInviteStep] = useState<'select' | 'review'>('select');
  const [inviteError, setInviteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<StaffAction | null>(null);
  const [actionStaff, setActionStaff] = useState<AdminStaffMember | AdminStaffDetails | null>(null);
  const [actionError, setActionError] = useState('');
  const [auditResult, setAuditResult] = useState<AdminStaffPage<AdminStaffAuditEvent> | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState('');

  const refresh = useCallback(async () => {
    if (!token) {
      setPageError('Your session has expired. Please sign in again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setPageError('');
    setAccessDenied(false);
    const [staffResponse, invitationResponse, permissionResponse] = await Promise.all([
      getAdminStaff(token, staffPage, PAGE_SIZE),
      getAdminStaffInvitations(token, invitationPage, PAGE_SIZE),
      getAdminStaffPermissions(token),
    ]);

    const failure = [staffResponse, invitationResponse, permissionResponse].find((response) => !response.ok);
    if (failure && !failure.ok) {
      setAccessDenied(failure.status === 403);
      setPageError(failure.error.message);
      setIsLoading(false);
      return;
    }

    if (staffResponse.ok && invitationResponse.ok && permissionResponse.ok) {
      setStaffResult(staffResponse.data.data);
      setInvitationResult(invitationResponse.data.data);
      setPermissions(permissionResponse.data.data);
    }
    setIsLoading(false);
  }, [invitationPage, staffPage, token]);

  useEffect(() => {
    void refresh();
  }, [refresh, reloadKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(null), 5500);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!token || !selectedStaffId || (dialog !== 'details' && dialog !== 'permissions')) return undefined;
    let active = true;
    setIsLoadingDetails(true);
    setDetailsError('');
    void getAdminStaffDetails(token, selectedStaffId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setStaffDetails(result.data.data);
        const available = new Set(permissions.map(({ key }) => key));
        setPermissionSelection(result.data.data.permissions
          .filter((permission) => permission.enabled && available.has(permission.key))
          .map(({ key }) => key));
      } else {
        setDetailsError(result.error.message);
      }
      setIsLoadingDetails(false);
    });
    return () => { active = false; };
  }, [dialog, permissions, reloadKey, selectedStaffId, token]);

  useEffect(() => {
    if (!token || !selectedStaffId || dialog !== 'audit') return undefined;
    let active = true;
    setIsLoadingAudit(true);
    setAuditError('');
    void getAdminStaffAudit(token, selectedStaffId, auditPage, PAGE_SIZE).then((result) => {
      if (!active) return;
      if (result.ok) setAuditResult(result.data.data);
      else setAuditError(result.error.message);
      setIsLoadingAudit(false);
    });
    return () => { active = false; };
  }, [auditPage, auditReloadKey, dialog, selectedStaffId, token]);

  const staffGroups = useMemo(() => groupByModule(permissions), [permissions]);
  const permissionMap = useMemo(() => new Map(permissions.map((permission) => [permission.key, permission])), [permissions]);
  const filteredStaff = useMemo(() => {
    const items = staffResult?.items ?? [];
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((staff) => {
      const searchable = `${staff.firstName} ${staff.lastName} ${staff.email}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const status = staffStatus(staff).toLowerCase();
      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesPermission = !permissionFilter || staff.permissionKeys.includes(permissionFilter);
      return matchesSearch && matchesStatus && matchesPermission;
    });
  }, [permissionFilter, search, staffPage, staffResult, statusFilter]);
  const filteredInvitations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (invitationResult?.items ?? []).filter((invitation) => (
      (!normalizedSearch || invitation.email.toLowerCase().includes(normalizedSearch))
      && (!invitationFilter || invitationStatus(invitation).toLowerCase() === invitationFilter)
    ));
  }, [invitationFilter, invitationResult, search]);

  const openInvite = () => {
    setInviteEmail('');
    setInviteSelection([]);
    setInviteStep('select');
    setInviteError('');
    setDialog('invite');
  };

  const openStaffDialog = (staffId: string, nextDialog: 'details' | 'permissions') => {
    setSelectedStaffId(staffId);
    setStaffDetails(null);
    setPermissionStep('edit');
    setDialog(nextDialog);
  };

  const openActionDialog = (action: StaffAction, staff?: AdminStaffMember | AdminStaffDetails, invitation?: AdminStaffInvitation) => {
    setSelectedStaffId(staff?.id ?? '');
    setActionStaff(staff ?? staffDetails);
    setSelectedInvitation(invitation ?? null);
    setPendingAction(action);
    setActionError('');
    setDialog('action');
  };

  const toggleKey = (keys: string[], setKeys: (next: string[]) => void, key: string) => {
    setKeys(keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
  };

  const sendInvitation = async () => {
    if (!token || isSubmitting) return;
    setInviteError('');
    setIsSubmitting(true);
    const result = await createAdminStaffInvitation(token, {
      email: inviteEmail.trim(),
      permissionKeys: inviteSelection,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setInviteError(result.error.message);
      return;
    }

    setDialog(null);
    setActiveTab('invitations');
    setInvitationPage(1);
    setReloadKey((value) => value + 1);
    setNotice({
      tone: 'success',
      message: result.data.data.emailSent === false
        ? 'The invitation was created, but its email was not confirmed as delivered.'
        : 'Invitation sent. The administrator will receive an email with an activation link.',
    });
  };

  const savePermissions = async () => {
    if (!token || !staffDetails || isSubmitting) return;
    setDetailsError('');
    setIsSubmitting(true);
    const result = await updateAdminStaffPermissions(token, staffDetails.id, permissionSelection);
    setIsSubmitting(false);
    if (!result.ok) {
      setDetailsError(result.error.message);
      return;
    }
    setPermissionStep('edit');
    setNotice({ tone: 'success', message: 'Administrator permissions updated.' });
    setReloadKey((value) => value + 1);
  };

  const performAction = async () => {
    if (!token || !pendingAction || isSubmitting) return;
    setActionError('');
    setIsSubmitting(true);
    let result;
    if (pendingAction === 'resend' && selectedInvitation) {
      result = await resendAdminStaffInvitation(token, selectedInvitation.id);
    } else if (pendingAction === 'revoke' && selectedInvitation) {
      result = await revokeAdminStaffInvitation(token, selectedInvitation.id);
    } else if (pendingAction === 'suspend') {
      result = await suspendAdminStaff(token, selectedStaffId);
    } else if (pendingAction === 'reactivate') {
      result = await reactivateAdminStaff(token, selectedStaffId);
    } else {
      setIsSubmitting(false);
      setActionError('This action is unavailable. Refresh the page and try again.');
      return;
    }
    setIsSubmitting(false);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    const messages: Record<StaffAction, string> = {
      resend: 'A new invitation link has been sent. The previous link is no longer valid.',
      revoke: 'The invitation was revoked.',
      suspend: 'The administrator has been suspended and their active sessions revoked.',
      reactivate: 'The administrator is active again. They must sign in to start a new session.',
    };
    setDialog(null);
    setNotice({ tone: 'success', message: messages[pendingAction] });
    setReloadKey((value) => value + 1);
  };

  const openAudit = (staffId: string) => {
    setSelectedStaffId(staffId);
    setAuditPage(1);
    setAuditResult(null);
    setDialog('audit');
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPermissionFilter('');
    setInvitationFilter('');
  };

  if (accessDenied) {
    return (
      <section className="admin-page admin-staff-page">
        <div className="admin-staff-access-denied">
          <FaShieldAlt aria-hidden="true" />
          <h1>Staff management is restricted</h1>
          <p>Your administrator account does not have access to this section.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page admin-staff-page" aria-busy={isLoading}>
      <header className="admin-staff-hero">
        <div>
          <span className="admin-staff-eyebrow"><FaShieldAlt aria-hidden="true" /> Access administration</span>
          <h1>Staff Management</h1>
          <p>Manage administrator accounts, assign responsibilities and control access to LeamJobs.</p>
        </div>
        <button type="button" className="admin-staff-button admin-staff-button--primary" onClick={openInvite}>
          <FaUserPlus aria-hidden="true" /> Invite Administrator
        </button>
      </header>

      {notice ? (
        <div className={`admin-staff-alert admin-staff-alert--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
          {notice.message}
          <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button>
        </div>
      ) : null}

      <div className="admin-staff-stats" aria-label="Staff management overview">
        <article className="admin-staff-stat">
          <span className="admin-staff-stat__icon"><FaUsers aria-hidden="true" /></span>
          <div><strong>{staffResult?.pagination.total ?? '—'}</strong><span>Staff administrators</span></div>
        </article>
        <article className="admin-staff-stat">
          <span className="admin-staff-stat__icon admin-staff-stat__icon--indigo"><FaEnvelope aria-hidden="true" /></span>
          <div><strong>{invitationResult?.pagination.total ?? '—'}</strong><span>Invitations recorded</span></div>
        </article>
      </div>

      <div className="admin-staff-toolbar">
        <div className="admin-staff-tabs" role="tablist" aria-label="Staff records">
          <button type="button" role="tab" aria-selected={activeTab === 'staff'} className={activeTab === 'staff' ? 'is-active' : ''} onClick={() => { setActiveTab('staff'); setSearch(''); }}>
            Administrators
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'invitations'} className={activeTab === 'invitations' ? 'is-active' : ''} onClick={() => { setActiveTab('invitations'); setSearch(''); }}>
            Invitations
          </button>
        </div>
        <div className="admin-staff-toolbar__actions">
          <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => void refresh()} disabled={isLoading}>
            <FaRedo aria-hidden="true" /> Refresh
          </button>
          {activeTab === 'staff' ? (
            <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={clearFilters}>
              <FaFilter aria-hidden="true" /> Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {pageError ? (
        <div className="admin-staff-alert admin-staff-alert--error" role="alert">
          <span>{pageError}</span>
          <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => void refresh()} disabled={isLoading}>Try again</button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="admin-staff-loading" role="status"><span className="admin-staff-spinner" aria-hidden="true" /> Loading staff records…</div>
      ) : pageError ? null : activeTab === 'staff' ? (
        <>
          <div className="admin-staff-filters">
            <label className="admin-staff-search">
              <FaSearch aria-hidden="true" />
              <span className="sr-only">Search the current page by name or email</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page by name or email" />
            </label>
            <label>
              <span className="sr-only">Filter by account status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by permission</span>
              <select value={permissionFilter} onChange={(event) => setPermissionFilter(event.target.value)}>
                <option value="">All responsibilities</option>
                {permissions.map((permission) => <option key={permission.key} value={permission.key}>{permission.description}</option>)}
              </select>
            </label>
          </div>

          <section className="admin-staff-list" aria-label="Staff administrators">
            {filteredStaff.length === 0 ? (
              <div className="admin-staff-empty">
                <span><FaUsers aria-hidden="true" /></span>
                <h2>{staffResult?.items.length ? 'No administrators match these filters' : 'No staff administrators yet'}</h2>
                <p>{staffResult?.items.length ? 'Clear or adjust the filters to see more administrators.' : 'Invite a trusted team member and assign only the responsibilities they need.'}</p>
                {staffResult?.items.length ? (
                  <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={clearFilters}>Clear filters</button>
                ) : (
                  <button type="button" className="admin-staff-button admin-staff-button--primary" onClick={openInvite}><FaPlus aria-hidden="true" /> Invite Administrator</button>
                )}
              </div>
            ) : (
              <>
                <div className="admin-staff-list__head" aria-hidden="true">
                  <span>Administrator</span><span>Status</span><span>Permissions</span><span>Joined</span><span>Actions</span>
                </div>
                {filteredStaff.map((staff) => (
                  <article className="admin-staff-row" key={staff.id}>
                    <div className="admin-staff-person">
                      <span className="admin-staff-avatar" aria-hidden="true">{staff.firstName.slice(0, 1)}{staff.lastName.slice(0, 1)}</span>
                      <div><strong>{staff.firstName} {staff.lastName}</strong><span>{staff.email}</span></div>
                    </div>
                    <div><span className={`admin-staff-status admin-staff-status--${staffStatus(staff).toLowerCase()}`}>{staffStatus(staff)}</span></div>
                    <div><strong>{staff.permissionKeys.length}</strong><span> assigned</span></div>
                    <div><span className="admin-staff-mobile-label">Joined</span>{dateLabel(staff.createdAt)}</div>
                    <div className="admin-staff-row__actions">
                      <button type="button" className="admin-staff-icon-button" onClick={() => openStaffDialog(staff.id, 'details')} aria-label={`View ${staff.firstName} ${staff.lastName}`}>
                        <FaEye aria-hidden="true" />
                      </button>
                      <button type="button" className="admin-staff-icon-button" onClick={() => openStaffDialog(staff.id, 'permissions')} aria-label={`Manage permissions for ${staff.firstName} ${staff.lastName}`}>
                        <FaKey aria-hidden="true" />
                      </button>
                      <button type="button" className="admin-staff-icon-button" onClick={() => openActionDialog(staffStatus(staff) === 'Active' ? 'suspend' : 'reactivate', staff)} aria-label={`${staffStatus(staff) === 'Active' ? 'Suspend' : 'Reactivate'} ${staff.firstName} ${staff.lastName}`}>
                        {staffStatus(staff) === 'Active' ? <FaUserSlash aria-hidden="true" /> : <FaUserCheck aria-hidden="true" />}
                      </button>
                    </div>
                  </article>
                ))}
              </>
            )}
          </section>
          <PageControls
            page={staffResult?.pagination.page ?? staffPage}
            totalPages={staffResult?.pagination.totalPages ?? 1}
            onChange={setStaffPage}
          />
          <p className="admin-staff-pagination-note">Search and filters apply to the currently loaded page.</p>
        </>
      ) : (
        <>
          <div className="admin-staff-filters admin-staff-filters--invitations">
            <label className="admin-staff-search">
              <FaSearch aria-hidden="true" />
              <span className="sr-only">Search invitations on the current page by email</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page by email" />
            </label>
            <label>
              <span className="sr-only">Filter invitations by status</span>
              <select value={invitationFilter} onChange={(event) => setInvitationFilter(event.target.value)}>
                <option value="">All invitation statuses</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="accepted">Accepted</option>
                <option value="revoked">Revoked</option>
              </select>
            </label>
            <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => { setSearch(''); setInvitationFilter(''); }}>Clear filters</button>
          </div>
          <section className="admin-staff-list admin-staff-list--invitations" aria-label="Administrator invitations">
            {filteredInvitations.length === 0 ? (
              <div className="admin-staff-empty">
                <span><FaEnvelope aria-hidden="true" /></span>
                <h2>{invitationResult?.items.length ? 'No invitations match these filters' : 'No invitations yet'}</h2>
                <p>{invitationResult?.items.length ? 'Clear or adjust the filters to view other invitations.' : 'Invitations you create will appear here with their current status and expiry.'}</p>
                <button type="button" className="admin-staff-button admin-staff-button--primary" onClick={openInvite}><FaPlus aria-hidden="true" /> Invite Administrator</button>
              </div>
            ) : (
              <>
                <div className="admin-staff-invitation-head" aria-hidden="true">
                  <span>Email and permissions</span><span>Status</span><span>Invited</span><span>Expires</span><span>Actions</span>
                </div>
                {filteredInvitations.map((invitation) => {
                  const status = invitationStatus(invitation);
                  const canManage = !invitation.acceptedAt && !invitation.revokedAt;
                  return (
                    <article className="admin-staff-invitation-row" key={invitation.id}>
                      <div className="admin-staff-invitation-person">
                        <strong>{invitation.email}</strong>
                        <span>{invitation.permissionKeys.length} permission{invitation.permissionKeys.length === 1 ? '' : 's'} selected</span>
                        <div className="admin-staff-chip-list">
                          {invitation.permissionKeys.slice(0, 3).map((key) => <span className="admin-staff-chip" key={key}>{permissionMap.get(key)?.description ?? key}</span>)}
                          {invitation.permissionKeys.length > 3 ? <span className="admin-staff-chip">+{invitation.permissionKeys.length - 3} more</span> : null}
                        </div>
                      </div>
                      <div><span className="admin-staff-mobile-label">Status</span><span className={`admin-staff-status admin-staff-status--${status.toLowerCase()}`}>{status}</span></div>
                      <div><span className="admin-staff-mobile-label">Invited</span>{dateLabel(invitation.createdAt)}</div>
                      <div><span className="admin-staff-mobile-label">{invitation.acceptedAt ? 'Accepted' : 'Expires'}</span>{dateLabel(invitation.acceptedAt ?? invitation.expiresAt)}</div>
                      <div className="admin-staff-row__actions">
                        {canManage ? (
                          <>
                            <button type="button" className="admin-staff-icon-button" onClick={() => openActionDialog('resend', undefined, invitation)} aria-label={`Resend invitation to ${invitation.email}`} title="Resend invitation"><FaRedo aria-hidden="true" /></button>
                            <button type="button" className="admin-staff-icon-button admin-staff-icon-button--danger" onClick={() => openActionDialog('revoke', undefined, invitation)} aria-label={`Revoke invitation for ${invitation.email}`} title="Revoke invitation"><FaUserSlash aria-hidden="true" /></button>
                          </>
                        ) : <span className="admin-staff-muted">No actions</span>}
                      </div>
                    </article>
                  );
                })}
              </>
            )}
          </section>
          <PageControls
            page={invitationResult?.pagination.page ?? invitationPage}
            totalPages={invitationResult?.pagination.totalPages ?? 1}
            onChange={setInvitationPage}
          />
          <p className="admin-staff-pagination-note">Search and filters apply to the currently loaded page.</p>
        </>
      )}

      {dialog === 'invite' ? (
        <Modal
          title={inviteStep === 'select' ? 'Invite administrator' : 'Review invitation'}
          description={inviteStep === 'select' ? 'Choose an email address and the access this administrator needs.' : 'Confirm the invitation details before sending.'}
          onClose={() => !isSubmitting && setDialog(null)}
          wide
          busy={isSubmitting}
        >
          <form
            className="admin-staff-modal__body"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (inviteStep === 'select') {
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim()) || inviteSelection.length === 0) {
                  setInviteError('Enter an email address and select at least one permission.');
                  return;
                }
                setInviteError('');
                setInviteStep('review');
              } else {
                void sendInvitation();
              }
            }}
          >
            {inviteStep === 'select' ? (
              <>
                <label className="admin-staff-field">
                  <span>Email address</span>
                  <input type="email" autoComplete="email" maxLength={320} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required placeholder="name@example.com" />
                </label>
                <div className="admin-staff-permission-heading">
                  <div><h3>Assign permissions</h3><p>No access is selected by default. Choose only what this role requires.</p></div>
                  <span>{inviteSelection.length} selected</span>
                </div>
                <PermissionChecklist
                  groups={staffGroups}
                  selectedKeys={inviteSelection}
                  onToggle={(key) => toggleKey(inviteSelection, setInviteSelection, key)}
                />
              </>
            ) : (
              <div className="admin-staff-review">
                <div><span>Administrator email</span><strong>{inviteEmail.trim()}</strong></div>
                <div><span>Permissions ({inviteSelection.length})</span><PermissionPills keys={inviteSelection} permissionMap={permissionMap} /></div>
                <p>The administrator will receive a one-time email link to create their own password. The invitation expires after 48 hours.</p>
              </div>
            )}
            {inviteError ? <div className="admin-staff-alert admin-staff-alert--error" role="alert">{inviteError}</div> : null}
            <footer className="admin-staff-modal__actions">
              {inviteStep === 'review' ? (
                <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setInviteStep('select')} disabled={isSubmitting}><FaArrowLeft aria-hidden="true" /> Back to edit</button>
              ) : null}
              <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setDialog(null)} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="admin-staff-button admin-staff-button--primary" disabled={isSubmitting || permissions.length === 0}>
                {inviteStep === 'review' ? (isSubmitting ? 'Sending…' : 'Send Invitation') : 'Review invitation'}
              </button>
            </footer>
          </form>
        </Modal>
      ) : null}

      {(dialog === 'details' || dialog === 'permissions') ? (
        <Modal
          title={dialog === 'details' ? 'Administrator details' : permissionStep === 'review' ? 'Review permission changes' : 'Manage permissions'}
          description={dialog === 'details' ? 'Account status and current access.' : 'Review and update this administrator’s access.'}
          onClose={() => !isSubmitting && setDialog(null)}
          wide={dialog === 'permissions'}
          busy={isSubmitting}
        >
          {isLoadingDetails ? (
            <div className="admin-staff-loading" role="status"><span className="admin-staff-spinner" aria-hidden="true" /> Loading administrator…</div>
          ) : detailsError ? (
            <div className="admin-staff-modal__body"><div className="admin-staff-alert admin-staff-alert--error" role="alert">{detailsError}</div><button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>
          ) : staffDetails ? dialog === 'details' ? (
            <div className="admin-staff-modal__body">
              <div className="admin-staff-detail-person">
                <span className="admin-staff-avatar admin-staff-avatar--large" aria-hidden="true">{staffDetails.firstName.slice(0, 1)}{staffDetails.lastName.slice(0, 1)}</span>
                <div><h3>{staffDetails.firstName} {staffDetails.lastName}</h3><p>{staffDetails.email}</p><span className={`admin-staff-status admin-staff-status--${staffStatus(staffDetails).toLowerCase()}`}>{staffStatus(staffDetails)}</span></div>
              </div>
              <div className="admin-staff-detail-grid">
                <div><span>Joined</span><strong>{dateLabel(staffDetails.createdAt)}</strong></div>
                <div><span>Last sign-in</span><strong>{dateTimeLabel(staffDetails.lastLogin)}</strong></div>
                <div><span>Email verified</span><strong>{staffDetails.isVerified ? 'Yes' : 'No'}</strong></div>
                <div><span>Assigned permissions</span><strong>{staffDetails.permissions.length}</strong></div>
              </div>
              <section className="admin-staff-detail-permissions">
                <div className="admin-staff-section-title"><h3>Current permissions</h3><button type="button" className="admin-staff-text-button" onClick={() => setDialog('permissions')}>Manage</button></div>
                {staffDetails.permissions.length ? (
                  <div className="admin-staff-chip-list">
                    {staffDetails.permissions.map((permission) => <span className={`admin-staff-chip ${permission.enabled ? '' : 'admin-staff-chip--disabled'}`} key={permission.key}>{permission.description}{!permission.enabled ? ' · disabled' : ''}</span>)}
                  </div>
                ) : <p className="admin-staff-muted">No permissions are currently assigned.</p>}
              </section>
              <div className="admin-staff-modal__actions admin-staff-modal__actions--spread">
                <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => openAudit(staffDetails.id)}><FaHistory aria-hidden="true" /> Audit history</button>
                {staffDetails.id !== user?.id ? (
                  <button type="button" className={`admin-staff-button ${staffStatus(staffDetails) === 'Active' ? 'admin-staff-button--danger' : 'admin-staff-button--primary'}`} onClick={() => openActionDialog(staffStatus(staffDetails) === 'Active' ? 'suspend' : 'reactivate', staffDetails)}>
                    {staffStatus(staffDetails) === 'Active' ? 'Suspend administrator' : 'Reactivate administrator'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="admin-staff-modal__body">
              {permissionStep === 'edit' ? (
                <>
                  <div className="admin-staff-detail-person admin-staff-detail-person--compact">
                    <span className="admin-staff-avatar" aria-hidden="true">{staffDetails.firstName.slice(0, 1)}{staffDetails.lastName.slice(0, 1)}</span>
                    <div><strong>{staffDetails.firstName} {staffDetails.lastName}</strong><span>{staffDetails.email}</span></div>
                  </div>
                  {staffDetails.permissions.some((permission) => !permission.enabled) ? (
                    <div className="admin-staff-alert admin-staff-alert--info" role="status">Some currently assigned permissions are disabled in the catalogue. They will be removed when these changes are saved.</div>
                  ) : null}
                  <PermissionChecklist
                    groups={staffGroups}
                    selectedKeys={permissionSelection}
                    onToggle={(key) => toggleKey(permissionSelection, setPermissionSelection, key)}
                  />
                </>
              ) : (
                <div className="admin-staff-review">
                  <p>Review the exact access changes for <strong>{staffDetails.firstName} {staffDetails.lastName}</strong>.</p>
                  <div><span>Grant ({permissionSelection.filter((key) => !staffDetails.permissions.some((permission) => permission.enabled && permission.key === key)).length})</span>
                    <PermissionPills keys={permissionSelection.filter((key) => !staffDetails.permissions.some((permission) => permission.enabled && permission.key === key))} permissionMap={permissionMap} emptyLabel="No new permissions" />
                  </div>
                  <div><span>Revoke ({staffDetails.permissions.filter((permission) => permission.enabled && !permissionSelection.includes(permission.key)).length + staffDetails.permissions.filter((permission) => !permission.enabled).length})</span>
                    <PermissionPills keys={staffDetails.permissions.filter((permission) => !permission.enabled || !permissionSelection.includes(permission.key)).map(({ key }) => key)} permissionMap={permissionMap} emptyLabel="No permissions being revoked" />
                  </div>
                </div>
              )}
              {detailsError ? <div className="admin-staff-alert admin-staff-alert--error" role="alert">{detailsError}</div> : null}
              <footer className="admin-staff-modal__actions">
                {permissionStep === 'review' ? <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setPermissionStep('edit')} disabled={isSubmitting}><FaArrowLeft aria-hidden="true" /> Back to edit</button> : null}
                <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setDialog(null)} disabled={isSubmitting}>Cancel</button>
                {permissionStep === 'edit' ? (
                  <button type="button" className="admin-staff-button admin-staff-button--primary" onClick={() => setPermissionStep('review')} disabled={permissionSelection.length === 0 && staffDetails.permissions.length === 0}>Review changes</button>
                ) : (
                  <button type="button" className="admin-staff-button admin-staff-button--primary" onClick={() => void savePermissions()} disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save permissions'}</button>
                )}
              </footer>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {dialog === 'audit' ? (
        <Modal title="Audit history" description="Read-only staff account activity." onClose={() => setDialog('details')} wide>
          <div className="admin-staff-modal__body">
            {isLoadingAudit ? <div className="admin-staff-loading" role="status"><span className="admin-staff-spinner" aria-hidden="true" /> Loading audit history…</div> : auditError ? (
              <div className="admin-staff-alert admin-staff-alert--error" role="alert">{auditError}<button type="button" onClick={() => setAuditReloadKey((value) => value + 1)}>Retry</button></div>
            ) : auditResult?.items.length ? (
              <ol className="admin-staff-audit-list">
                {auditResult.items.map((event) => (
                  <li key={event.id}>
                    <span className="admin-staff-audit-icon" aria-hidden="true"><FaHistory /></span>
                    <div>
                      <strong>{auditActionLabel[event.action] ?? moduleLabel(event.action)}</strong>
                      <p>{event.entityType === 'ADMIN_PERMISSION' && event.entityId
                        ? permissionMap.get(event.entityId)?.description ?? event.entityId
                        : event.actorId === event.subjectId ? 'Action recorded for this administrator' : 'Action performed by a Super Admin'}</p>
                      <time dateTime={event.createdAt}>{dateTimeLabel(event.createdAt)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="admin-staff-empty admin-staff-empty--compact"><span><FaHistory aria-hidden="true" /></span><h2>No audit activity yet</h2><p>Administrative changes will be recorded here.</p></div>
            )}
            {auditResult ? <PageControls page={auditResult.pagination.page} totalPages={auditResult.pagination.totalPages} onChange={setAuditPage} /> : null}
          </div>
        </Modal>
      ) : null}

      {dialog === 'action' && pendingAction ? (
        <Modal title={actionTitle(pendingAction)} description={actionDescription(pendingAction)} onClose={() => !isSubmitting && setDialog(null)} busy={isSubmitting}>
          <div className="admin-staff-modal__body">
            {pendingAction === 'suspend' || pendingAction === 'reactivate' ? (
              <div className="admin-staff-confirm-target">
                <strong>{actionStaff?.firstName ?? ''} {actionStaff?.lastName ?? ''}</strong>
                <span>{actionStaff?.email ?? ''}</span>
              </div>
            ) : selectedInvitation ? <div className="admin-staff-confirm-target"><strong>{selectedInvitation.email}</strong></div> : null}
            {actionError ? <div className="admin-staff-alert admin-staff-alert--error" role="alert">{actionError}</div> : null}
            <footer className="admin-staff-modal__actions">
              <button type="button" className="admin-staff-button admin-staff-button--secondary" onClick={() => setDialog(null)} disabled={isSubmitting}>Cancel</button>
              <button type="button" className={`admin-staff-button ${pendingAction === 'suspend' || pendingAction === 'revoke' ? 'admin-staff-button--danger' : 'admin-staff-button--primary'}`} onClick={() => void performAction()} disabled={isSubmitting}>
                {isSubmitting ? 'Working…' : actionButtonLabel(pendingAction)}
              </button>
            </footer>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function PermissionChecklist({
  groups,
  selectedKeys,
  onToggle,
}: {
  groups: Record<string, AdminStaffPermission[]>;
  selectedKeys: string[];
  onToggle: (key: string) => void;
}) {
  const groupEntries = Object.entries(groups);
  if (groupEntries.length === 0) {
    return <div className="admin-staff-empty admin-staff-empty--compact"><h2>No permissions are available</h2><p>Try again later or contact your system administrator.</p></div>;
  }
  return (
    <div className="admin-staff-permission-groups">
      <p className="admin-staff-permission-note">
        Some administrative actions require all related permissions. The server checks each action independently; selecting one permission does not grant related access.
      </p>
      {groupEntries.map(([module, items]) => (
        <fieldset className="admin-staff-permission-group" key={module}>
          <legend>{moduleLabel(module)}</legend>
          {items.map((permission) => (
            <label className="admin-staff-permission-option" key={permission.key}>
              <input type="checkbox" checked={selectedKeys.includes(permission.key)} onChange={() => onToggle(permission.key)} />
              <span className="admin-staff-checkmark" aria-hidden="true"><FaCheck /></span>
              <span><strong>{permission.description}</strong><small>{permission.key}</small></span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function PermissionPills({
  keys,
  permissionMap,
  emptyLabel = 'None',
}: {
  keys: string[];
  permissionMap: Map<string, AdminStaffPermission>;
  emptyLabel?: string;
}) {
  if (keys.length === 0) return <span className="admin-staff-muted">{emptyLabel}</span>;
  return (
    <div className="admin-staff-chip-list">
      {keys.map((key) => <span className="admin-staff-chip" key={key}>{permissionMap.get(key)?.description ?? key}</span>)}
    </div>
  );
}

function actionTitle(action: StaffAction) {
  const titles: Record<StaffAction, string> = {
    resend: 'Resend invitation?',
    revoke: 'Revoke invitation?',
    suspend: 'Suspend administrator?',
    reactivate: 'Reactivate administrator?',
  };
  return titles[action];
}

function actionDescription(action: StaffAction) {
  const descriptions: Record<StaffAction, string> = {
    resend: 'The current invitation link will stop working and a new link will be emailed.',
    revoke: 'This invitation can no longer be accepted after it is revoked.',
    suspend: 'Suspending this administrator will immediately remove their access to protected LeamJobs administration features. Their existing sessions will be revoked.',
    reactivate: 'Reactivating this administrator restores their account access. They must sign in again because previous sessions remain revoked.',
  };
  return descriptions[action];
}

function actionButtonLabel(action: StaffAction) {
  const labels: Record<StaffAction, string> = {
    resend: 'Resend invitation',
    revoke: 'Revoke invitation',
    suspend: 'Suspend Administrator',
    reactivate: 'Reactivate Administrator',
  };
  return labels[action];
}

export default AdminStaffPage;
