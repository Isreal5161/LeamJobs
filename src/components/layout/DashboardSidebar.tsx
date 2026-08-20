import { Link } from 'react-router-dom';

type SidebarProps = {
  role: 'seeker' | 'employer' | 'admin';
};

const sidebarLinks = {
  seeker: [
    { label: 'Dashboard', to: '/seeker/dashboard' },
    { label: 'Profile', to: '/seeker/profile' },
    { label: 'Applications', to: '/seeker/applications' },
    { label: 'Saved Jobs', to: '/seeker/saved-jobs' },
    { label: 'Settings', to: '/seeker/settings' },
  ],
  employer: [
    { label: 'Dashboard', to: '/employer/dashboard' },
    { label: 'Jobs', to: '/employer/jobs' },
    { label: 'Applicants', to: '/employer/applicants' },
    { label: 'Company Profile', to: '/employer/profile' },
    { label: 'Settings', to: '/employer/settings' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Jobs', to: '/admin/jobs' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Analytics', to: '/admin/analytics' },
  ],
};

function DashboardSidebar({ role }: SidebarProps) {
  return (
    <aside style={{ width: 260, padding: '1.5rem', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Dashboard</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>Quick access</p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sidebarLinks[role].map((item) => (
          <Link key={item.to} to={item.to} style={{ padding: '0.9rem 1rem', borderRadius: '16px', color: '#0f172a', background: '#f8fafc' }}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default DashboardSidebar;
