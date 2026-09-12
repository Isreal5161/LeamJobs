import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBriefcase,
  FaBuilding,
  FaClipboardList,
  FaComments,
  FaEdit,
  FaEllipsisH,
  FaFilter,
  FaFlag,
  FaHome,
  FaMoneyBillWave,
  FaCrown,
  FaStar,
  FaTimes,
  FaUser,
} from 'react-icons/fa';

const adminPrimaryLinks = [
  { label: 'Overview', to: '/admin/dashboard', icon: FaHome, match: (path: string) => path === '/admin/dashboard' || path === '/admin' },
  { label: 'Jobs', to: '/admin/jobs', icon: FaBriefcase, match: (path: string) => path.startsWith('/admin/jobs') },
  { label: 'Review', to: '/admin/moderation', icon: FaFlag, match: (path: string) => path.startsWith('/admin/moderation') },
  { label: 'Users', to: '/admin/users', icon: FaUser, match: (path: string) => path.startsWith('/admin/users') },
  { label: 'Content', to: '/admin/content', icon: FaEdit, match: (path: string) => path.startsWith('/admin/content') },
];

function MobileBottomNav() {
  const { pathname } = useLocation();
  const seekerMode = pathname.startsWith('/seeker');
  const employerMode = pathname.startsWith('/employer');
  const adminMode = pathname.startsWith('/admin');

  if (adminMode) {
    return (
      <nav className="mobile-bottom-nav mobile-bottom-nav--admin" aria-label="Admin mobile navigation">
        {adminPrimaryLinks.map(({ icon: Icon, ...item }) => (
          <Link
            to={item.to}
            key={item.to}
            className={`mobile-bottom-nav__item ${item.match(pathname) ? 'mobile-bottom-nav__item--active' : ''}`}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  // Seeker/Employer navigation
  const homePath = seekerMode ? '/seeker/dashboard' : employerMode ? '/employer/dashboard' : '/';
  const jobsPath = seekerMode ? '/seeker/jobs' : employerMode ? '/employer/jobs' : '/jobs';
  const applicationsPath = seekerMode ? '/seeker/applications' : employerMode ? '/employer/applicants' : '/applications';
  const messagesPath = seekerMode ? '/seeker/messages' : employerMode ? '/employer/messages' : '/messages';
  const profilePath = seekerMode ? '/seeker/profile' : employerMode ? '/employer/profile' : '/profile';
  const paymentsPath = seekerMode ? '/seeker/payments' : '/payments';
  const applicationsLabel = employerMode ? 'Applicants' : 'Applications';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link to={homePath} className={`mobile-bottom-nav__item ${pathname === homePath || (seekerMode && pathname === '/seeker') ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaHome />
        <span>Home</span>
      </Link>
      <Link to={jobsPath} className={`mobile-bottom-nav__item ${pathname.startsWith(jobsPath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaBriefcase />
        <span>Jobs</span>
      </Link>
      <Link to={applicationsPath} className={`mobile-bottom-nav__item ${pathname.startsWith(applicationsPath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaClipboardList />
        <span>{applicationsLabel}</span>
      </Link>
      <Link to={messagesPath} className={`mobile-bottom-nav__item ${pathname.startsWith(messagesPath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaComments />
        <span>Messages</span>
      </Link>
      {seekerMode ? <Link to={paymentsPath} className={`mobile-bottom-nav__item ${pathname.startsWith(paymentsPath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaMoneyBillWave />
        <span>Payments</span>
      </Link> : null}
      <Link to={profilePath} className={`mobile-bottom-nav__item ${pathname.startsWith(profilePath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaUser />
        <span>Profile</span>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
