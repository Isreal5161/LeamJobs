import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import AccountMenu from './AccountMenu';
import { getEmployerProfile, getEmployerProfileLogo, getSeekerProfile, getSeekerProfilePicture, PROFILE_IMAGE_UPDATED_EVENT } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type DashboardTopbarProps = {
  isOpen?: boolean;
  onToggle?: () => void;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
  role?: 'seeker' | 'employer' | 'admin';
  userName?: string;
  onLogout?: () => void;
};

const primaryNav: Record<'seeker' | 'employer' | 'admin', { label: string; to: string }[]> = {
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
  admin: [
    { label: 'Overview', to: '/admin/dashboard' },
    { label: 'Moderation', to: '/admin/moderation' },
    { label: 'Job Posts', to: '/admin/jobs' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Companies', to: '/admin/companies' },
  ],
};

const accountNav: Record<'seeker' | 'employer' | 'admin', { label: string; to: string }[]> = {
  seeker: [
    { label: 'Payments', to: '/seeker/payments' },
    { label: 'Profile', to: '/seeker/profile' },
  ],
  employer: [
    { label: 'Company Profile', to: '/employer/profile' },
  ],
  admin: [
    { label: 'Page Content', to: '/admin/content' },
    { label: 'Filters', to: '/admin/filters' },
    { label: 'Recommendations', to: '/admin/recommendations' },
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Subscriptions', to: '/admin/subscriptions' },
  ],
};

function DashboardTopbar({
  isOpen = false,
  onToggle,
  onMobileMenuToggle,
  mobileMenuOpen = false,
  role,
  userName,
  onLogout,
}: DashboardTopbarProps) {
  const { token } = useAuth();
  const [accountName, setAccountName] = useState(userName || '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    setAccountName(userName || '');
  }, [userName]);

  useEffect(() => {
    if (!role || !token) return undefined;
    let active = true;
    let objectUrl: string | null = null;

    const loadAccountProfile = async () => {
      setIsImageLoading(true);
      let imageReference: string | null = null;
      if (role === 'employer') {
        const profileResult = await getEmployerProfile(token);
        if (!active) return;
        const employerProfile = profileResult.ok ? profileResult.data.data.profile : null;
        setAccountName(employerProfile?.companyName || userName || 'Employer');
        imageReference = employerProfile?.companyLogoUrl ?? null;
      } else {
        const profileResult = await getSeekerProfile(token);
        if (!active) return;
        if (profileResult.ok) {
          const seekerProfile = profileResult.data.data.profile;
          const seekerUser = profileResult.data.data.user;
          setAccountName(`${seekerUser.firstName} ${seekerUser.lastName}`.trim() || userName || 'Job seeker');
          imageReference = seekerProfile?.profilePictureUrl ?? null;
        }
      }
      if (!imageReference) {
        setImageUrl(null);
        setIsImageLoading(false);
        return;
      }

      const imageResult = role === 'employer' ? await getEmployerProfileLogo(token) : await getSeekerProfilePicture(token);
      if (!active) return;
      if (imageResult.ok) {
        objectUrl = URL.createObjectURL(imageResult.data);
        setImageUrl(objectUrl);
      } else {
        setImageUrl(null);
      }
      setIsImageLoading(false);
    };

    const handleImageUpdate = () => { void loadAccountProfile(); };
    window.addEventListener(PROFILE_IMAGE_UPDATED_EVENT, handleImageUpdate);
    void loadAccountProfile();

    return () => {
      active = false;
      window.removeEventListener(PROFILE_IMAGE_UPDATED_EVENT, handleImageUpdate);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [role, token, userName]);

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
        <AccountMenu
          items={accountNav[role]}
          userName={accountName}
          roleLabel={role === 'employer' ? 'Employer' : role === 'admin' ? 'Admin' : 'Job Seeker'}
          imageUrl={imageUrl}
          isImageLoading={isImageLoading}
          onLogout={onLogout}
        />
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
