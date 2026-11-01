import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import JobUpdatesSubscriptionPopup from '../components/public/JobUpdatesSubscriptionPopup';
import HomeAuthRoleModal, { type AuthRoleModalMode } from '../components/public/HomeAuthRoleModal';
import '../styles/public-theme.css';

function PublicLayout() {
  const { pathname } = useLocation();
  const [authRoleModalMode, setAuthRoleModalMode] = useState<AuthRoleModalMode | null>(null);
  const openAuthRoleModal = useCallback((mode: AuthRoleModalMode) => setAuthRoleModalMode(mode), []);
  const closeAuthRoleModal = useCallback(() => setAuthRoleModalMode(null), []);
  const isWelcomePage = pathname === '/';
  const isAboutPage = pathname === '/about';
  const isFeaturesPage = pathname === '/features';
  const isHowPage = pathname === '/how-it-works';
  const isCompaniesPage = pathname === '/companies';
  const isCompanyDetailsPage = pathname.startsWith('/companies/');
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/employers/');
  const isJobDetailsPage = pathname.startsWith('/jobs/');
  const layoutClasses = [
    'public-layout',
    isWelcomePage ? 'public-layout--welcome' : '',
    isAboutPage ? 'public-layout--about' : '',
    isFeaturesPage ? 'public-layout--features' : '',
    isHowPage ? 'public-layout--how' : '',
    isCompaniesPage ? 'public-layout--companies' : '',
    isAuthPage ? 'public-layout--auth' : '',
    isJobDetailsPage ? 'public-layout--job-detail' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={layoutClasses}>
      <Navbar onOpenAuthRoleModal={openAuthRoleModal} />
      <main className="container">
        <Outlet context={{ openAuthRoleModal }} />
      </main>
      <Footer />
      {authRoleModalMode ? (
        <HomeAuthRoleModal mode={authRoleModalMode} onClose={closeAuthRoleModal} />
      ) : null}
      <JobUpdatesSubscriptionPopup enabled={!isAuthPage && !isJobDetailsPage && !pathname.startsWith('/unsubscribe-') && !pathname.startsWith('/reset-password')} />
      {!isWelcomePage && !isAboutPage && !isFeaturesPage && !isHowPage && !isCompaniesPage && !isCompanyDetailsPage && !isAuthPage && !isJobDetailsPage && <MobileBottomNav />}
    </div>
  );
}

export default PublicLayout;
