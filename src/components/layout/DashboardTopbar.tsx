import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaBell, FaBars, FaCheck, FaTimes } from 'react-icons/fa';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import { getEmployerProfile, getEmployerProfileLogo, getNotifications, getSeekerProfile, getSeekerProfilePicture, markAllNotificationsRead, markNotificationRead, PROFILE_IMAGE_UPDATED_EVENT, type AppNotification } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { resolveAccountTypeForPlan, useSubscriptions } from '../../context/SubscriptionContext';

type DashboardTopbarProps = {
  isOpen?: boolean;
  onToggle?: () => void;
  role?: 'seeker' | 'employer' | 'admin';
  userName?: string;
  onLogout?: () => void;
};

const primaryNav: Record<'seeker' | 'employer' | 'admin', { label: string; to: string }[]> = {
  seeker: [
    { label: 'Dashboard', to: '/seeker/dashboard' },
    { label: 'Jobs', to: '/seeker/jobs' },
    { label: 'Applications', to: '/seeker/applications' },
    { label: 'Messages', to: '/seeker/messages' },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer/dashboard' },
    { label: 'Jobs', to: '/employer/jobs' },
    { label: 'Candidates', to: '/employer/candidates' },
    { label: 'Applicants', to: '/employer/applicants' },
    { label: 'Messages', to: '/employer/messages' },
  ],
  admin: [
    { label: 'Overview', to: '/admin/dashboard' },
    { label: 'Moderation', to: '/admin/moderation' },
    { label: 'Job Posts', to: '/admin/jobs' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Companies', to: '/admin/companies' },
    { label: 'Communications', to: '/admin/communications' },
  ],
};

const accountNav: Record<'seeker' | 'employer' | 'admin', { label: string; to: string }[]> = {
  seeker: [
    { label: 'Payments', to: '/seeker/payments' },
    { label: 'Profile', to: '/seeker/profile' },
    { label: 'Subscription', to: '/seeker/subscription' },
  ],
  employer: [
    { label: 'Company Profile', to: '/employer/profile' },
    { label: 'Verification', to: '/employer/verification' },
  ],
  admin: [
    { label: 'Page Content', to: '/admin/content' },
    { label: 'Filters', to: '/admin/filters' },
    { label: 'Recommendations', to: '/admin/recommendations' },
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Subscriptions', to: '/admin/subscriptions' },
    { label: 'Verifications', to: '/admin/verifications' },
  ],
};

function DashboardTopbar({
  isOpen = false,
  onToggle,
  role,
  userName,
  onLogout,
}: DashboardTopbarProps) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { getSubscription, plans } = useSubscriptions();
  const [accountName, setAccountName] = useState(userName || '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRefreshingNotifications, setIsRefreshingNotifications] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const seekerAccountLabel = useMemo(() => {
    if (role !== 'seeker') return null;
    const subscription = user?.id ? getSubscription(user.id) : null;
    return resolveAccountTypeForPlan(subscription?.planId ?? 'free', plans, 'Basic');
  }, [getSubscription, plans, role, user?.id]);

  useEffect(() => {
    setAccountName(userName || '');
  }, [userName]);

  useEffect(() => {
    if (!role || !token) {
      setNotifications([]);
      return undefined;
    }

    let active = true;
    const loadNotifications = async () => {
      setIsRefreshingNotifications(true);
      const result = await getNotifications(token, role.toUpperCase() as 'SEEKER' | 'EMPLOYER' | 'ADMIN');
      if (!active) return;
      if (result.ok) {
        setNotifications(result.data.data.notifications);
      }
      setIsRefreshingNotifications(false);
    };

    void loadNotifications();

    return () => { active = false; };
  }, [role, token]);

  useEffect(() => {
    if (!role || !token) return undefined;
    let active = true;
    let objectUrl: string | null = null;

    const loadAccountProfile = async () => {
      setIsImageLoading(true);

      if (role === 'admin') {
        const nextName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || userName || 'Admin';
        if (active) {
          setAccountName(nextName);
          setImageUrl(null);
          setIsImageLoading(false);
        }
        return;
      }

      let imageReference: string | null = null;
      if (role === 'employer') {
        const profileResult = await getEmployerProfile(token);
        if (!active) return;
        const employerProfile = profileResult.ok ? profileResult.data.data.profile : null;
        setAccountName(employerProfile?.companyName || userName || 'Employer');
        imageReference = employerProfile?.companyLogoUrl ?? null;
      } else {
        const profileResult = await getSeekerProfile(token);
        if (!active) return;
        if (profileResult.ok) {
          const seekerProfile = profileResult.data.data.profile;
          const seekerUser = profileResult.data.data.user;
          setAccountName(`${seekerUser.firstName} ${seekerUser.lastName}`.trim() || userName || 'Job seeker');
          imageReference = seekerProfile?.profilePictureUrl ?? null;
        }
      }
      if (!imageReference) {
        setImageUrl(null);
        setIsImageLoading(false);
        return;
      }

      const imageResult = role === 'employer' ? await getEmployerProfileLogo(token) : await getSeekerProfilePicture(token);
      if (!active) return;
      if (imageResult.ok) {
        objectUrl = URL.createObjectURL(imageResult.data);
        setImageUrl(objectUrl);
      } else {
        setImageUrl(null);
      }
      setIsImageLoading(false);
    };

    const handleImageUpdate = () => { void loadAccountProfile(); };
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, handleImageUpdate);
    void loadAccountProfile();

    return () => {
      active = false;
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, handleImageUpdate);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [role, token, user, userName]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!token || !role) return;

    if (!notification.isRead) {
      const result = await markNotificationRead(token, role.toUpperCase() as 'SEEKER' | 'EMPLOYER' | 'ADMIN', notification.id);
      if (result.ok) {
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
      }
    }

    if (notification.link) {
      const target = notification.link.startsWith('/') ? notification.link : `/${notification.link}`;
      navigate(target);
    }
    setIsNotificationsOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (!token || !role) return;
    const result = await markAllNotificationsRead(token, role.toUpperCase() as 'SEEKER' | 'EMPLOYER' | 'ADMIN');
    if (result.ok) {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    }
  };

  const brand = (
    <Logo className="dashboard-topbar__brand" tagline="Career workspace" />
  );

  if (role) {
    return (
      <header className="dashboard-topbar dashboard-topbar--dashboard">
        {brand}
        <nav className="dashboard-topbar__nav" aria-label={`${role} navigation`}>
          {primaryNav[role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `dashboard-topbar__link ${isActive ? 'dashboard-topbar__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-topbar__utility">
          <div className="dashboard-topbar__notification-wrap">
            <button
              type="button"
              className="dashboard-topbar__notification-button"
              aria-label="Open notifications"
              onClick={() => setIsNotificationsOpen((open) => !open)}
            >
              <FaBell aria-hidden="true" />
              {unreadCount > 0 ? <span className="dashboard-topbar__notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
            </button>
            {isNotificationsOpen ? (
              <div className="dashboard-topbar__notification-panel">
                <div className="dashboard-topbar__notification-header">
                  <strong>Notifications</strong>
                  {notifications.length > 0 ? (
                    <button type="button" className="dashboard-topbar__notification-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                  ) : null}
                </div>
                {isRefreshingNotifications ? <div className="dashboard-topbar__notification-empty">Loading…</div> : notifications.length === 0 ? (
                  <div className="dashboard-topbar__notification-empty">No notifications yet.</div>
                ) : (
                  <div className="dashboard-topbar__notification-list">
                    {notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`dashboard-topbar__notification-item ${notification.isRead ? '' : 'dashboard-topbar__notification-item--unread'}`}
                        onClick={() => void handleNotificationClick(notification)}
                      >
                        <span className="dashboard-topbar__notification-type">{notification.type}</span>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                        <time>{new Date(notification.createdAt).toLocaleDateString()}</time>
                        {!notification.isRead ? <FaCheck className="dashboard-topbar__notification-dot" aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" className="dashboard-topbar__notification-view-all" onClick={() => { setIsNotificationsOpen(false); navigate(`/${role}/notifications`); }}>
                  View all notifications
                </button>
              </div>
            ) : null}
          </div>
          {role === 'seeker' && seekerAccountLabel ? (
            <span className="dashboard-topbar__account-badge">{seekerAccountLabel}</span>
          ) : null}
          <AccountMenu
            items={accountNav[role]}
            userName={accountName}
            roleLabel={role === 'employer' ? 'Employer' : role === 'admin' ? 'Admin' : 'Job Seeker'}
            imageUrl={imageUrl}
            isImageLoading={isImageLoading}
            onLogout={onLogout}
          />
        </div>
      </header>
    );
  }

  return (
    <header className="dashboard-topbar">
      {brand}
      <button
        type="button"
        className="dashboard-topbar__toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
    </header>
  );
}

export default DashboardTopbar;
