import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { FaBuilding, FaCrown, FaEdit, FaFilter, FaFlag, FaHome, FaMoneyBillWave, FaStar, FaUser } from 'react-icons/fa';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';

const adminMenuLinks = [
  { label: 'Overview', to: '/admin/dashboard', icon: FaHome },
  { label: 'Moderation', to: '/admin/moderation', icon: FaFlag },
  { label: 'Job Posts', to: '/admin/jobs', icon: FaUser },
  { label: 'Page Content', to: '/admin/content', icon: FaEdit },
  { label: 'Filters', to: '/admin/filters', icon: FaFilter },
  { label: 'Recommendations', to: '/admin/recommendations', icon: FaStar },
  { label: 'Users', to: '/admin/users', icon: FaUser },
  { label: 'Companies', to: '/admin/companies', icon: FaBuilding },
  { label: 'Payments', to: '/admin/payments', icon: FaMoneyBillWave },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: FaCrown },
];

function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-layout">
      <div className="admin-layout__shell">
        <DashboardTopbar
          role="admin"
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)}
        />
        {mobileMenuOpen ? (
          <>
            <button
              type="button"
              className="admin-layout__menu-backdrop"
              aria-label="Close admin navigation menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <nav className="admin-mobile-menu" aria-label="Admin additional navigation">
              <div className="admin-mobile-menu__header">
                <span>Admin tools</span>
                <strong>More sections</strong>
              </div>
              <div className="admin-mobile-menu__list">
                {adminMenuLinks.map(({ icon: Icon, ...item }) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `admin-mobile-menu__item ${isActive ? 'admin-mobile-menu__item--active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          </>
        ) : null}
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default AdminLayout;
