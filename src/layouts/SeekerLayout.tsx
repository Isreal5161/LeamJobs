import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Footer from '../components/layout/Footer';

function SeekerLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isJobDetailPage = pathname.startsWith('/seeker/jobs/');

  return (
    <div className={`seeker-layout${isJobDetailPage ? ' seeker-layout--job-detail' : ''}`}>
      <div className="seeker-layout__shell">
        <DashboardTopbar role="seeker" userName={user?.firstName} onLogout={logout} />
        <main className="seeker-layout__main">
          <Outlet />
        </main>
      </div>
      <Footer variant="compact" />
      <MobileBottomNav />
    </div>
  );
}

export default SeekerLayout;
