import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaChevronLeft, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from '../../services/api';

type NotificationsPageProps = {
  role: 'seeker' | 'employer' | 'admin';
};

const notificationToneStyles = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ALERT: 'alert',
} as const;

function NotificationsPage({ role }: NotificationsPageProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

  const loadNotifications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getNotifications(token, role.toUpperCase() as 'SEEKER' | 'EMPLOYER' | 'ADMIN');
    if (result.ok) {
      setNotifications(result.data.data.notifications);
      setError('');
    } else {
      setError(result.error.message || 'Unable to load notifications.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadNotifications();
  }, [role, token]);

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!token) return;

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
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    const result = await markAllNotificationsRead(token, role.toUpperCase() as 'SEEKER' | 'EMPLOYER' | 'ADMIN');
    if (result.ok) {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <button type="button" className="notifications-page__back" onClick={() => navigate(`/${role}/dashboard`)}>
          <FaChevronLeft />
          Back
        </button>
        <div>
          <span className="notifications-page__eyebrow">Inbox</span>
          <h1>Notifications</h1>
        </div>
        <button type="button" className="notifications-page__mark-all" onClick={() => void handleMarkAllRead()} disabled={unreadCount === 0}>
          Mark all read
        </button>
      </div>

      <div className="notifications-page__summary">
        <div className="notifications-page__count-card">
          <FaBell />
          <div>
            <strong>{notifications.length}</strong>
            <span>Total</span>
          </div>
        </div>
        <div className="notifications-page__count-card notifications-page__count-card--muted">
          <FaCheck />
          <div>
            <strong>{notifications.filter((notification) => notification.isRead).length}</strong>
            <span>Read</span>
          </div>
        </div>
        <div className="notifications-page__count-card notifications-page__count-card--warn">
          <FaInfoCircle />
          <div>
            <strong>{unreadCount}</strong>
            <span>Unread</span>
          </div>
        </div>
      </div>

      {error ? <div className="notifications-page__error">{error}</div> : null}

      {loading ? (
        <div className="notifications-page__skeleton-list" aria-label="Loading notifications" aria-busy="true">
          {[1, 2, 3].map((item) => <div className="notifications-page__skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <FaBell />
          <strong>No notifications yet</strong>
          <p>When there’s activity on your account, it will appear here.</p>
          <Link to={`/${role}/dashboard`} className="notifications-page__empty-link">Return to dashboard</Link>
        </div>
      ) : (
        <div className="notifications-page__list">
          {notifications.map((notification) => {
            const tone = notificationToneStyles[notification.type] ?? 'info';
            const Icon = notification.type === 'WARNING' || notification.type === 'ALERT' ? FaExclamationTriangle : FaInfoCircle;

            return (
              <button
                type="button"
                key={notification.id}
                className={`notifications-page__item notifications-page__item--${tone} ${notification.isRead ? '' : 'notifications-page__item--unread'}`}
                onClick={() => void handleOpenNotification(notification)}
              >
                <div className="notifications-page__icon"><Icon /></div>
                <div className="notifications-page__content">
                  <div className="notifications-page__meta">
                    <span>{notification.type}</span>
                    <time>{new Date(notification.createdAt).toLocaleString()}</time>
                  </div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
                {!notification.isRead ? <span className="notifications-page__badge">Unread</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
