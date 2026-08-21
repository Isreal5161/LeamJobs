import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function EmployerLayout() {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className={`employer-layout ${menuOpen ? 'employer-layout--menu-open' : 'employer-layout--menu-closed'}`}>
      <div className="employer-layout__shell">
        <div className="employer-layout__sidebar">
          <DashboardSidebar role="employer" isOpen={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
        </div>
        <main className="employer-layout__main">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default EmployerLayout;
