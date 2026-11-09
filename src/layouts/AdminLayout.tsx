import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useAuth } from '../context/AuthContext';
import { getCurrentAdminPermissions } from '../services/api';
import { isAdminRouteAllowed, type AdminPermissionState } from '../utils/adminNavigation.js';
import { createKeyedSingleFlight } from '../utils/keyedSingleFlight.js';

function AdminLayout() {
  const { logout, token, user } = useAuth();
  const { pathname } = useLocation();
  const [adminPermissionState, setAdminPermissionState] = useState<AdminPermissionState>({ status: 'loading' });
  const [permissionRefreshError, setPermissionRefreshError] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const permissionRequests = useMemo(() => createKeyedSingleFlight(), []);
  const verifiedSession = useRef<string | null>(null);
  const lastVerificationAttempt = useRef(0);
  const currentSession = token && user?.id ? `${user.id}:${token}` : '';
  const currentSessionRef = useRef(currentSession);
  currentSessionRef.current = currentSession;

  const loadAdminPermissions = useCallback(async (background = false) => {
    if (!token || user?.role !== 'ADMIN') {
      setAdminPermissionState({ status: 'forbidden', message: 'Your account is not permitted to access the admin dashboard.' });
      return;
    }

    if (permissionRequests.has(currentSession)) {
      return permissionRequests.run(currentSession, async () => undefined);
    }

    const isBackgroundRefresh = background && verifiedSession.current === currentSession;
    if (!isBackgroundRefresh) setAdminPermissionState({ status: 'loading' });
    setPermissionRefreshError('');
    lastVerificationAttempt.current = Date.now();

    return permissionRequests.run(currentSession, async () => {
      let result: Awaited<ReturnType<typeof getCurrentAdminPermissions>>;
      try {
        result = await getCurrentAdminPermissions(token);
      } catch (error) {
        if (currentSessionRef.current !== currentSession) return;
        const message = error instanceof Error ? error.message : 'Admin permissions could not be verified.';
        if (isBackgroundRefresh) setPermissionRefreshError(message);
        else setAdminPermissionState({ status: 'error', message });
        return;
      }

      if (currentSessionRef.current !== currentSession) return;

      if (result.ok) {
        verifiedSession.current = currentSession;
        setAdminPermissionState({ status: 'ready', data: result.data.data });
        setPermissionRefreshError('');
      } else if (result.status === 401 || result.status === 403) {
        verifiedSession.current = null;
        setAdminPermissionState({ status: 'forbidden', message: 'Your admin account is not permitted to access this dashboard.' });
        setPermissionRefreshError('');
      } else if (isBackgroundRefresh) {
        setPermissionRefreshError(result.error.message || 'Admin permissions could not be refreshed. Protected actions remain subject to server authorization.');
      } else {
        setAdminPermissionState({ status: 'error', message: result.error.message });
      }
    });
  }, [currentSession, permissionRequests, token, user?.id, user?.role]);

  useEffect(() => {
    void loadAdminPermissions();

    const refreshWhenVisible = () => {
      const cooldownElapsed = Date.now() - lastVerificationAttempt.current >= 60_000;
      if (document.visibilityState === 'visible' && cooldownElapsed) {
        void loadAdminPermissions(true);
      }
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadAdminPermissions]);

  const routeAllowed = isAdminRouteAllowed(pathname, adminPermissionState);

  return (
    <div className={`admin-layout ${isSidebarExpanded ? '' : 'admin-layout--menu-closed'}`}>
      <div className="admin-layout__sidebar">
        <DashboardSidebar
          role="admin"
          isOpen={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded((expanded) => !expanded)}
          adminPermissionState={adminPermissionState}
        />
      </div>
      <div className="admin-layout__shell">
        <DashboardTopbar
          role="admin"
          adminPermissionState={adminPermissionState}
          onLogout={logout}
        />
        <main className="admin-layout__main">
          {adminPermissionState.status === 'loading' ? (
            <section className="admin-permission-state" role="status">Verifying admin access…</section>
          ) : adminPermissionState.status === 'error' ? (
            <section className="admin-permission-state admin-permission-state--error" role="alert">
              <span>{adminPermissionState.message}</span>
              <button type="button" onClick={() => void loadAdminPermissions()}>Retry</button>
            </section>
          ) : adminPermissionState.status === 'forbidden' ? (
            <section className="admin-permission-state admin-permission-state--error" role="alert">
              {adminPermissionState.message}
            </section>
          ) : routeAllowed ? (
            <>
              {permissionRefreshError ? (
                <section className="admin-permission-state admin-permission-state--error" role="alert">
                  <span>{permissionRefreshError}</span>
                  <button type="button" onClick={() => void loadAdminPermissions(true)}>Retry</button>
                </section>
              ) : null}
              <Outlet context={adminPermissionState} />
            </>
          ) : (
            <section className="admin-permission-state admin-permission-state--error" role="alert">
              You do not have permission to access this admin page.
            </section>
          )}
        </main>
      </div>
      <MobileBottomNav adminPermissionState={adminPermissionState} />
    </div>
  );
}

export default AdminLayout;
