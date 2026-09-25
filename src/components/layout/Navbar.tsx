import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/companies', label: 'Companies' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
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
              <Link to="/login" className="button button--outline navbar__button">Sign in</Link>
              <Link to="/register" className="button button--primary navbar__button">Get started</Link>
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
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink>
            <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
