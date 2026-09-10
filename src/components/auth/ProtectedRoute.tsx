import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type AuthRole } from '../../context/AuthContext';
import { getSeekerProfile } from '../../services/api';

type ProtectedRouteProps = {
  children: JSX.Element;
  allowedRoles?: AuthRole[];
};

const ROLE_LOGIN_PATH: Record<AuthRole, string> = {
  SEEKER: '/login',
  EMPLOYER: '/employers/login',
  ADMIN: '/admin/login',
};

const ROLE_DASHBOARD_PATH: Record<AuthRole, string> = {
  SEEKER: '/seeker/dashboard',
  EMPLOYER: '/employer/jobs',
  ADMIN: '/admin/moderation',
};

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onboardingCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user || !token || user.role !== 'SEEKER') {
      return;
    }

    if (location.pathname === '/seeker/onboarding') {
      onboardingCheckRef.current = user.id;
      return;
    }

    if (onboardingCheckRef.current === user.id) {
      return;
    }

    let isActive = true;

    const checkOnboarding = async () => {
      const result = await getSeekerProfile(token);

      if (!isActive || !user || user.role !== 'SEEKER') {
        return;
      }

      if (result.ok && result.data.data.onboardingComplete === false) {
        navigate('/seeker/onboarding', { replace: true });
      }
    };

    void checkOnboarding();
    onboardingCheckRef.current = user.id;

    return () => {
      isActive = false;
    };
  }, [isLoading, location.pathname, navigate, token, user]);

  if (isLoading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite" aria-label="Loading LeamJobs">
        <div className="auth-loading__brand site-logo" aria-hidden="true">
          <span className="site-logo__mark">LJ</span>
          <span className="site-logo__text">LeamJobs</span>
        </div>
        <span className="leamjobs-spinner leamjobs-spinner--accent leamjobs-spinner--lg" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    const loginPath = location.pathname.startsWith('/admin')
      ? '/admin/login'
      : location.pathname.startsWith('/employer')
        ? '/employers/login'
        : '/login';

    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to={ROLE_DASHBOARD_PATH.ADMIN} replace />;
    }

    return <Navigate to={ROLE_DASHBOARD_PATH[user.role]} replace />;
  }

  return children;
}

export default ProtectedRoute;
