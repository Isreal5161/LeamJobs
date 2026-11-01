import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import HomeAuthRoleModal, { type AuthRoleModalMode } from '../public/HomeAuthRoleModal';

function PublicLayout() {
  const [authRoleModalMode, setAuthRoleModalMode] = useState<AuthRoleModalMode | null>(null);
  const openAuthRoleModal = useCallback((mode: AuthRoleModalMode) => setAuthRoleModalMode(mode), []);
  const closeAuthRoleModal = useCallback(() => setAuthRoleModalMode(null), []);

  return (
    <div>
      <Navbar onOpenAuthRoleModal={openAuthRoleModal} />
      <main className="container">
        <Outlet context={{ openAuthRoleModal }} />
      </main>
      <Footer />
      {authRoleModalMode ? (
        <HomeAuthRoleModal mode={authRoleModalMode} onClose={closeAuthRoleModal} />
      ) : null}
    </div>
  );
}

export default PublicLayout;
