import { Outlet } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';

function AdminLayout() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <DashboardSidebar role="admin" />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
