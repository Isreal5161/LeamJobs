import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useAuth } from '../context/AuthContext';
import { getCurrentAdminPermissions } from '../services/api';
import { isAdminRouteAllowed, type AdminPermissionState } from '../utils/adminNavigation.js';

function AdminLayout() {
  const { logout, token, user } = useAuth();
  const { pathname } = useLocation();
  const [adminPermissionState, setAdminPermissionState] = useState<AdminPermissionState>({ status: 'loading' });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const requestId = useRef(0);

  const loadAdminPermissions = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setAdminPermissionState({ status: 'loading' });
    if (!token || user?.role !== 'ADMIN') {
      setAdminPermissionState({ status: 'forbidden', message: 'Your account is not permitted to access the admin dashboard.' });
      return;
    }

    const result = await getCurrentAdminPermissions(token);
    if (currentRequestId !== requestId.current) return;
    if (result.ok) {
      setAdminPermissionState({ status: 'ready', data: result.data.data });
    } else if (result.status === 403) {
      setAdminPermissionState({ status: 'forbidden', message: 'Your admin account is not permitted to access this dashboard.' });
    } else {
      setAdminPermissionState({ status: 'error', message: result.error.message });
    }
  }, [token, user?.role]);

  useEffect(() => {
    void loadAdminPermissions();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadAdminPermissions();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      requestId.current += 1;
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
            <Outlet context={adminPermissionState} />
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
