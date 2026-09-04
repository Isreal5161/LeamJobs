import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthRole } from '../../context/AuthContext';

type ProtectedRouteProps = {
  children: JSX.Element;
  allowedRoles?: AuthRole[];
};

const ROLE_LOGIN_PATH: Record<AuthRole, string> = {
  SEEKER: '/login',
  EMPLOYER: '/employers/login',
  ADMIN: '/login',
};

const ROLE_DASHBOARD_PATH: Record<AuthRole, string> = {
  SEEKER: '/seeker/dashboard',
  EMPLOYER: '/employer/jobs',
  ADMIN: '/admin',
};

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    const loginPath = location.pathname.startsWith('/employer')
      ? '/employers/login'
      : '/login';

    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARD_PATH[user.role]} replace />;
  }

  return children;
}

export default ProtectedRoute;
