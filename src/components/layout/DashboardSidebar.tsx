import { NavLink } from 'react-router-dom';
import {
  FaBriefcase,
  FaBuilding,
  FaClipboardList,
  FaComments,
  FaEdit,
  FaFilter,
  FaFlag,
  FaHome,
  FaMoneyBillWave,
  FaStar,
  FaCrown,
  FaUser,
} from 'react-icons/fa';

type SidebarProps = {
  role: 'seeker' | 'employer' | 'admin';
  isOpen?: boolean;
  onToggle?: () => void;
};

const sidebarLinks = {
  seeker: [
    { label: 'Home', to: '/seeker/dashboard', icon: FaHome },
    { label: 'Jobs', to: '/seeker/jobs', icon: FaBriefcase },
    { label: 'Applications', to: '/seeker/applications', icon: FaClipboardList },
    { label: 'Messages', to: '/seeker/messages', icon: FaComments },
    { label: 'Payments', to: '/seeker/payments', icon: FaMoneyBillWave },
    { label: 'Profile', to: '/seeker/profile', icon: FaUser },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer/dashboard', icon: FaHome },
    { label: 'Jobs', to: '/employer/jobs', icon: FaBriefcase },
    { label: 'Applicants', to: '/employer/applicants', icon: FaClipboardList },
    { label: 'Messages', to: '/employer/messages', icon: FaComments },
    { label: 'Company Profile', to: '/employer/profile', icon: FaUser },
    { label: 'Payments', to: '/employer/payments', icon: FaMoneyBillWave },
  ],
  admin: [
    { label: 'Overview', to: '/admin/dashboard', icon: FaHome },
    { label: 'Moderation', to: '/admin/moderation', icon: FaFlag },
    { label: 'Job Posts', to: '/admin/jobs', icon: FaBriefcase },
    { label: 'Page Content', to: '/admin/content', icon: FaEdit },
    { label: 'Filters', to: '/admin/filters', icon: FaFilter },
    { label: 'Recommendations', to: '/admin/recommendations', icon: FaStar },
    { label: 'Users', to: '/admin/users', icon: FaUser },
    { label: 'Companies', to: '/admin/companies', icon: FaBuilding },
    { label: 'Payments', to: '/admin/payments', icon: FaMoneyBillWave },
    { label: 'Subscriptions', to: '/admin/subscriptions', icon: FaCrown },
  ],
};

function DashboardSidebar({ role, isOpen = true }: SidebarProps) {
  return (
    <aside className={`dashboard-menu ${isOpen ? 'dashboard-menu--open' : 'dashboard-menu--closed'}`}>
      <div className="dashboard-menu__header">
        <div className="dashboard-menu__brand" aria-hidden={!isOpen}>
          <span className="dashboard-menu__mark">LJ</span>
          <div className="dashboard-menu__brand-copy">
            <strong>LeamJobs</strong>
            <span>Career menu</span>
          </div>
        </div>
      </div>
      <nav className="dashboard-menu__nav" aria-label={`${role} navigation`}>
        {sidebarLinks[role].map(({ icon: Icon, ...item }) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `dashboard-menu__link ${isActive ? 'dashboard-menu__link--active' : ''}`
            }
            title={!isOpen ? item.label : undefined}
          >
            <span className="dashboard-menu__icon">
              <Icon />
            </span>
            <span className="dashboard-menu__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default DashboardSidebar;
