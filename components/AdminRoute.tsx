import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../lib/services';
import Spinner from './Spinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      if (loading) {
        return;
      }

      if (!currentUser) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const adminStatus = await AdminService.isAdmin(userProfile?.id || '');

        if (isMounted) {
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error);

        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    void checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [currentUser, loading, userProfile?.id]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
