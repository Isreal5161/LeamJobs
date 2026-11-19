import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardTopbar from '../components/layout/DashboardTopbar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import Footer from '../components/layout/Footer';
import EmployerProfileCompletionModal from '../components/employer/EmployerProfileCompletionModal';
import { getEmployerProfile, type EmployerProfileData } from '../services/api';

function EmployerLayout() {
  const { user, token, logout } = useAuth();
  const [profileStatus, setProfileStatus] = useState<'checking' | 'complete' | 'incomplete' | 'error'>('checking');
  const [profileData, setProfileData] = useState<EmployerProfileData | null>(null);
  const [profileError, setProfileError] = useState('');
  const [retryProfileCheck, setRetryProfileCheck] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'EMPLOYER') return undefined;
    let active = true;
    setProfileStatus('checking');
    setProfileError('');

    void getEmployerProfile(token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setProfileError(result.error.message || 'We could not check your company profile.');
        setProfileStatus('error');
        return;
      }

      const data = result.data.data;
      setProfileData(data);
      setProfileStatus(data.profile?.companyName.trim() && data.account.phone?.trim() ? 'complete' : 'incomplete');
    }).catch(() => {
      if (!active) return;
      setProfileError('We could not check your company profile. Please try again.');
      setProfileStatus('error');
    });

    return () => { active = false; };
  }, [retryProfileCheck, token, user?.role]);

  const handleProfileComplete = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="employer-layout">
      <div className="employer-layout__shell">
        <DashboardTopbar role="employer" userName={user?.firstName} onLogout={logout} />
        <main className="employer-layout__main">
          <Outlet />
        </main>
      </div>
      <Footer variant="compact" />
      <MobileBottomNav />
      {profileStatus === 'checking' ? (
        <div className="employer-profile-completion-check" role="status" aria-live="polite">
          <div>Checking your company profile…</div>
        </div>
      ) : null}
      {profileStatus === 'error' ? (
        <div className="employer-profile-completion-check" role="alert">
          <div>
            <strong>We couldn’t verify your company profile</strong>
            <p>{profileError}</p>
            <button type="button" onClick={() => setRetryProfileCheck((current) => current + 1)}>Try again</button>
          </div>
        </div>
      ) : null}
      {profileStatus === 'incomplete' && token ? (
        <EmployerProfileCompletionModal
          token={token}
          companyName={profileData?.profile?.companyName ?? ''}
          phone={profileData?.account.phone}
          onComplete={handleProfileComplete}
        />
      ) : null}
    </div>
  );
}

export default EmployerLayout;
