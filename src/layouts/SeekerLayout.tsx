import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Footer from '../components/layout/Footer';

function SeekerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="seeker-layout">
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
