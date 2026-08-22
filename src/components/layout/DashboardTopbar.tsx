import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

type DashboardTopbarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function DashboardTopbar({ isOpen, onToggle }: DashboardTopbarProps) {
  return (
    <header className="dashboard-topbar">
      <Link className="dashboard-topbar__brand" to="/" aria-label="Go to LeamJobs welcome page">
        <span className="dashboard-topbar__mark">LJ</span>
        <div className="dashboard-topbar__copy">
          <strong>LeamJobs</strong>
          <span>Career workspace</span>
        </div>
      </Link>
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
