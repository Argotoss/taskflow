import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../features/auth';

export const ProtectedRoute = (): JSX.Element => {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
