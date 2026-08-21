import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function SeekerLayout() {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className={`seeker-layout ${menuOpen ? 'seeker-layout--menu-open' : 'seeker-layout--menu-closed'}`}>
      <div className="seeker-layout__shell">
        <div className="seeker-layout__sidebar">
          <DashboardSidebar role="seeker" isOpen={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
        </div>
        <main className="seeker-layout__main">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default SeekerLayout;
