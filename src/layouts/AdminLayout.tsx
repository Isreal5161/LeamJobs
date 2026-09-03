import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className={`admin-layout ${menuOpen ? 'admin-layout--menu-open' : 'admin-layout--menu-closed'}`}>
      <div className="admin-layout__shell">
        <DashboardTopbar isOpen={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
        {menuOpen && (
          <button
            type="button"
            className="admin-layout__menu-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <div className="admin-layout__sidebar">
          <DashboardSidebar
            role="admin"
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((open) => !open)}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default AdminLayout;
