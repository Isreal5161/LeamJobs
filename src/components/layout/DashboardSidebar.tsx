import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import {
  FaBriefcase,
  FaFileContract,
  FaBuilding,
  FaClipboardList,
  FaComments,
  FaEdit,
  FaFilter,
  FaFlag,
  FaHome,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaStar,
  FaCrown,
  FaUser,
  FaCog,
  FaChartLine,
  FaBell,
  FaBullhorn,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import {
  getVisibleAdminNavigationSections,
  type AdminPermissionState,
} from '../../utils/adminNavigation.js';

type SidebarProps = {
  role: 'seeker' | 'employer' | 'admin';
  isOpen?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  adminPermissionState?: AdminPermissionState;
};

const sidebarLinks = {
  seeker: [
    { label: 'Home', to: '/seeker/dashboard', icon: FaHome },
    { label: 'Jobs', to: '/seeker/jobs', icon: FaBriefcase },
    { label: 'Applications', to: '/seeker/applications', icon: FaClipboardList },
    { label: 'Interviews', to: '/seeker/interviews', icon: FaCalendarCheck },
    { label: 'Messages', to: '/seeker/messages', icon: FaComments },
    { label: 'Payments', to: '/seeker/payments', icon: FaMoneyBillWave },
    { label: 'My CV', to: '/seeker/cv', icon: FaEdit },
    { label: 'Profile Settings', to: '/seeker/profile', icon: FaUser },
    { label: 'Subscription', to: '/seeker/subscription', icon: FaCrown },
    { label: 'Settings', to: '/seeker/settings', icon: FaCog },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer/dashboard', icon: FaHome },
    { label: 'Jobs', to: '/employer/jobs', icon: FaBriefcase },
    { label: 'Candidates', to: '/employer/candidates', icon: FaUser },
    { label: 'Applicants', to: '/employer/applicants', icon: FaClipboardList },
    { label: 'Interviews', to: '/employer/interviews', icon: FaCalendarCheck },
    { label: 'Contracts', to: '/employer/contracts', icon: FaFileContract },
    { label: 'Messages', to: '/employer/messages', icon: FaComments },
    { label: 'Company Profile', to: '/employer/profile', icon: FaUser },
    { label: 'Settings', to: '/employer/settings', icon: FaCog },
  ],
};

const adminIcons = {
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
  bell: FaBell,
  edit: FaEdit,
  filter: FaFilter,
  star: FaStar,
  cog: FaCog,
};

function DashboardSidebar({
  role,
  isOpen = true,
  onToggle,
  onNavigate,
  adminPermissionState,
}: SidebarProps) {
  const navItems = role === 'admin' && adminPermissionState?.status === 'ready'
    ? getVisibleAdminNavigationSections(adminPermissionState)
    : null;

  return (
    <aside className={`dashboard-menu ${isOpen ? 'dashboard-menu--open' : 'dashboard-menu--closed'}`}>
      <div className="dashboard-menu__header">
        <Logo className="dashboard-menu__brand" tagline="Career menu" />
        {role === 'admin' ? (
          <button
            type="button"
            className="dashboard-menu__toggle"
            aria-label={isOpen ? 'Collapse admin navigation' : 'Expand admin navigation'}
            aria-expanded={isOpen}
            title={isOpen ? 'Collapse navigation' : 'Expand navigation'}
            onClick={onToggle}
          >
            {isOpen ? <FaChevronLeft aria-hidden="true" /> : <FaChevronRight aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      {navItems ? (
        <nav className="dashboard-menu__nav dashboard-menu__nav--grouped" aria-label={`${role} navigation`}>
          {navItems.map((section) => (
            <div key={section.heading} className="dashboard-menu__group">
              <span className="dashboard-menu__group-label">{section.heading}</span>
              {section.items.map((item) => {
                const Icon = adminIcons[item.icon as keyof typeof adminIcons];
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `dashboard-menu__link ${isActive ? 'dashboard-menu__link--active' : ''}`}
                    onClick={onNavigate}
                    title={item.label}
                  >
                    <span className="dashboard-menu__icon">
                      <Icon />
                    </span>
                    <span className="dashboard-menu__label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      ) : role === 'admin' ? (
        <div className="dashboard-menu__loading" role="status">
          {adminPermissionState?.status === 'forbidden' ? 'Access denied' : adminPermissionState?.status === 'error' ? 'Navigation unavailable' : 'Loading navigation…'}
        </div>
      ) : (
        <nav className="dashboard-menu__nav" aria-label={`${role} navigation`}>
          {sidebarLinks[role].map(({ icon: Icon, ...item }) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `dashboard-menu__link ${isActive ? 'dashboard-menu__link--active' : ''}`
              }
              onClick={onNavigate}
              title={!isOpen ? item.label : undefined}
            >
              <span className="dashboard-menu__icon">
                <Icon />
              </span>
              <span className="dashboard-menu__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </aside>
  );
}

export default DashboardSidebar;
