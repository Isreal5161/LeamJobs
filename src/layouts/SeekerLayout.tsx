import { Outlet, Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';

function SeekerLayout() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <DashboardSidebar role="seeker" />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SeekerLayout;
