import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function SeekerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`seeker-layout ${menuOpen ? 'seeker-layout--menu-open' : 'seeker-layout--menu-closed'}`}>
      <div className="seeker-layout__shell">
        <DashboardTopbar isOpen={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
        {menuOpen && (
          <button
            type="button"
            className="seeker-layout__menu-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
        )}
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
