import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBriefcase, FaClipboardList, FaUser } from 'react-icons/fa';

function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link to="/" className={`mobile-bottom-nav__item ${pathname === '/' ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaHome />
        <span>Home</span>
      </Link>
      <Link to="/jobs" className={`mobile-bottom-nav__item ${pathname.startsWith('/jobs') ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaBriefcase />
        <span>Jobs</span>
      </Link>
      <Link to="/applications" className={`mobile-bottom-nav__item ${pathname.startsWith('/applications') ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaClipboardList />
        <span>Applications</span>
      </Link>
      <Link to="/profile" className={`mobile-bottom-nav__item ${pathname.startsWith('/profile') ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaUser />
        <span>Profile</span>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
