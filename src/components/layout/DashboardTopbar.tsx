import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import AccountMenu from './AccountMenu';

type DashboardTopbarProps = {
  isOpen?: boolean;
  onToggle?: () => void;
  /** Present only for seeker/employer - renders the horizontal nav + account menu. Admin keeps the legacy toggle header. */
  role?: 'seeker' | 'employer';
  userName?: string;
  onLogout?: () => void;
};

const primaryNav: Record<'seeker' | 'employer', { label: string; to: string }[]> = {
  seeker: [
    { label: 'Dashboard', to: '/seeker/dashboard' },
    { label: 'Jobs', to: '/seeker/jobs' },
    { label: 'Applications', to: '/seeker/applications' },
    { label: 'Messages', to: '/seeker/messages' },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer/dashboard' },
    { label: 'Jobs', to: '/employer/jobs' },
    { label: 'Applicants', to: '/employer/applicants' },
    { label: 'Messages', to: '/employer/messages' },
  ],
};

const accountNav: Record<'seeker' | 'employer', { label: string; to: string }[]> = {
  seeker: [
    { label: 'Payments', to: '/seeker/payments' },
    { label: 'Profile', to: '/seeker/profile' },
  ],
  employer: [
    { label: 'Company Profile', to: '/employer/profile' },
  ],
};

function DashboardTopbar({ isOpen = false, onToggle, role, userName, onLogout }: DashboardTopbarProps) {
  const brand = (
    <Link className="dashboard-topbar__brand" to="/" aria-label="Go to LeamJobs welcome page">
      <span className="dashboard-topbar__mark">LJ</span>
      <div className="dashboard-topbar__copy">
        <strong>LeamJobs</strong>
        <span>Career workspace</span>
      </div>
    </Link>
  );

  if (role) {
    return (
      <header className="dashboard-topbar dashboard-topbar--dashboard">
        {brand}
        <nav className="dashboard-topbar__nav" aria-label={`${role} navigation`}>
          {primaryNav[role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `dashboard-topbar__link ${isActive ? 'dashboard-topbar__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <AccountMenu items={accountNav[role]} userName={userName} onLogout={onLogout} />
      </header>
    );
  }

  return (
    <header className="dashboard-topbar">
      {brand}
      <button
        type="button"
        className="dashboard-topbar__toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
    </header>
  );
}

export default DashboardTopbar;
