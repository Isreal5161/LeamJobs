import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';
import type { AuthRoleModalMode } from '../public/HomeAuthRoleModal';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/companies', label: 'Companies' },
];

type NavbarProps = {
  onOpenAuthRoleModal: (mode: AuthRoleModalMode) => void;
};

function Navbar({ onOpenAuthRoleModal }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const isWelcomePage = useLocation().pathname === '/';
  const dashboardPath = user?.role === 'ADMIN'
    ? '/admin/moderation'
    : user?.role === 'EMPLOYER'
      ? '/employer/jobs'
      : '/seeker/dashboard';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />
        <div className="navbar__center">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'navbar__link--active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <button type="button" className="button button--outline navbar__button" onClick={handleLogout}>Log out</button>
              <Link to={dashboardPath} className="button button--primary navbar__button">Dashboard</Link>
            </>
          ) : (
            <>
              {isWelcomePage ? (
                <>
                  <button type="button" className="button button--outline navbar__button" onClick={() => onOpenAuthRoleModal('signin')}>Sign in</button>
                  <button type="button" className="button button--primary navbar__button" onClick={() => onOpenAuthRoleModal('signup')}>Get started</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="button button--outline navbar__button">Sign in</Link>
                  <Link to="/register" className="button button--primary navbar__button">Get started</Link>
                </>
              )}
            </>
          )}
        </div>
        <button
          className="navbar__menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      <nav className={`navbar__mobile-menu ${menuOpen ? 'navbar__mobile-menu--open' : ''}`} aria-label="Mobile menu">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => (isActive ? 'navbar__link--active' : undefined)}
          >
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated ? (
          <>
            <NavLink to={dashboardPath} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
            <button type="button" className="navbar__mobile-action" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            {isWelcomePage ? (
              <>
                <button type="button" className="navbar__mobile-action" onClick={() => { setMenuOpen(false); onOpenAuthRoleModal('signin'); }}>Sign in</button>
                <button type="button" className="navbar__mobile-action" onClick={() => { setMenuOpen(false); onOpenAuthRoleModal('signup'); }}>Register</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink>
                <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
