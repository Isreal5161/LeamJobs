import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function PublicLayout() {
  const { pathname } = useLocation();
  const isWelcomePage = pathname === '/';
  const isAboutPage = pathname === '/about';
  const isFeaturesPage = pathname === '/features';
  const isHowPage = pathname === '/how-it-works';
  const isCompaniesPage = pathname === '/companies';
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
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
      <Footer />
      {!isWelcomePage && !isAboutPage && !isFeaturesPage && !isHowPage && !isCompaniesPage && !isAuthPage && !isJobDetailsPage && <MobileBottomNav />}
    </div>
  );
}

export default PublicLayout;
