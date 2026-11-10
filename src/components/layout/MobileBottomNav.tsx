import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBriefcase,
  FaFileContract,
  FaBullhorn,
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
  FaUsers,
  FaChartLine,
  FaCog,
} from 'react-icons/fa';
import {
  ADMIN_MOBILE_LINK_PATHS,
  getVisibleAdminNavigationItems,
  type AdminPermissionState,
} from '../../utils/adminNavigation.js';

const adminMobileIcons = {
  home: FaHome,
  fileContract: FaFileContract,
  briefcase: FaBriefcase,
  flag: FaFlag,
  user: FaUser,
  building: FaBuilding,
  users: FaUsers,
  chart: FaChartLine,
  money: FaMoneyBillWave,
  crown: FaCrown,
  clipboard: FaClipboardList,
  bullhorn: FaBullhorn,
  edit: FaEdit,
  filter: FaFilter,
  star: FaStar,
  cog: FaCog,
};

type MobileBottomNavProps = {
  adminPermissionState?: AdminPermissionState;
};

function MobileBottomNav({ adminPermissionState }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const seekerMode = pathname.startsWith('/seeker');
  const employerMode = pathname.startsWith('/employer');
  const adminMode = pathname.startsWith('/admin');
  const seekerCvMode = seekerMode && pathname === '/seeker/cv';

  if (adminMode) {
    if (adminPermissionState?.status !== 'ready') return null;
    const links = getVisibleAdminNavigationItems(adminPermissionState, ADMIN_MOBILE_LINK_PATHS);
    const showStaffManagement = links.some(({ to }) => to === '/admin/staff');

    return (
      <nav className={`mobile-bottom-nav mobile-bottom-nav--admin ${showStaffManagement ? 'mobile-bottom-nav--admin-with-staff' : ''}`} aria-label="Admin mobile navigation">
        {links.map((item) => {
          const Icon = adminMobileIcons[item.icon as keyof typeof adminMobileIcons];
          const label = item.label === 'Communications'
            ? 'Comms'
            : item.label === 'Job Posts'
              ? 'Jobs'
              : item.label === 'Staff Management'
                ? 'Staff'
                : item.label;
          return (
            <Link
              to={item.to}
              key={item.to}
              aria-label={item.label}
              title={item.label}
              className={`mobile-bottom-nav__item ${pathname === item.to || pathname.startsWith(`${item.to}/`) ? 'mobile-bottom-nav__item--active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Seeker/Employer navigation
  const homePath = seekerMode ? '/seeker/dashboard' : employerMode ? '/employer/dashboard' : '/';
  const jobsPath = seekerMode ? '/seeker/jobs' : employerMode ? '/employer/jobs' : '/jobs';
  const candidatesPath = employerMode ? '/employer/candidates' : '';
  const applicationsPath = seekerMode ? '/seeker/applications' : employerMode ? '/employer/applicants' : '/applications';
  const messagesPath = seekerMode ? '/seeker/messages' : employerMode ? '/employer/messages' : '/messages';
  const profilePath = seekerMode ? (seekerCvMode ? '/seeker/cv' : '/seeker/profile') : employerMode ? '/employer/profile' : '/profile';
  const paymentsPath = seekerMode ? '/seeker/payments' : '/payments';
  const applicationsLabel = employerMode ? 'Applicants' : 'Applications';
  const profileLabel = seekerCvMode ? 'My CV' : seekerMode ? 'Profile Settings' : 'Profile';

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
      {employerMode ? <Link to={candidatesPath} className={`mobile-bottom-nav__item ${pathname.startsWith(candidatesPath) ? 'mobile-bottom-nav__item--active' : ''}`}>
        <FaUsers />
        <span>Candidates</span>
      </Link> : null}
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
      <Link
        to={profilePath}
        aria-current={pathname.startsWith(profilePath) ? 'page' : undefined}
        aria-label={profileLabel}
        className={`mobile-bottom-nav__item ${pathname.startsWith(profilePath) ? 'mobile-bottom-nav__item--active' : ''}`}
      >
        {seekerCvMode ? <FaEdit /> : <FaUser />}
        <span>{profileLabel}</span>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
