import { Outlet } from 'react-router-dom';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useAuth } from '../context/AuthContext';

function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="admin-layout">
      <div className="admin-layout__shell">
        <DashboardTopbar
          role="admin"
          onLogout={logout}
        />
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default AdminLayout;
