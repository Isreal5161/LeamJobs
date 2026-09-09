import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Footer from '../components/layout/Footer';

function EmployerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="employer-layout">
      <div className="employer-layout__shell">
        <DashboardTopbar role="employer" userName={user?.firstName} onLogout={logout} />
        <main className="employer-layout__main">
          <Outlet />
        </main>
      </div>
      <Footer variant="compact" />
      <MobileBottomNav />
    </div>
  );
}

export default EmployerLayout;
