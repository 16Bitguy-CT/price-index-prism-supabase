
import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_user' | 'power_user' | 'market_admin' | 'representative';
}

const roleHierarchy = {
  super_user: 4,
  power_user: 3,
  market_admin: 2,
  representative: 1,
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading, profileLoading, profileError, emergencyLogout } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing or profile is loading
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Handle missing profile case differently from inactive profile
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Profile Setup Required</h1>
          <p className="text-muted-foreground mb-4">
            {profileError 
              ? "Your profile could not be loaded. This might be because your profile was not created properly during signup."
              : "Your user profile is missing and needs to be created."
            }
          </p>
          <div className="space-y-2">
            <Link to="/emergency-setup">
              <Button className="w-full">
                Complete Profile Setup
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={emergencyLogout}
              className="w-full"
            >
              Logout and Try Again
            </Button>
          </div>
          {profileError && (
            <p className="text-xs text-muted-foreground mt-4">
              Error: {profileError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Handle pending approval status
  if (userProfile.approval_status === 'pending') {
    // Don't redirect to pending approval page if already there
    if (location.pathname === '/pending-approval') {
      return <>{children}</>;
    }
    return <Navigate to="/pending-approval" replace />;
  }

  // Handle rejected status
  if (userProfile.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Account Rejected</h1>
          <p className="text-muted-foreground mb-4">
            Your registration has been rejected. {userProfile.rejection_reason && `Reason: ${userProfile.rejection_reason}`}
          </p>
          <Button
            variant="outline"
            onClick={emergencyLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    );
  }

  // Handle inactive profile case
  if (!userProfile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Account Not Active</h1>
          <p className="text-muted-foreground mb-4">
            Your account exists but has been deactivated. Please contact your administrator to reactivate your account.
          </p>
          <Button
            variant="outline"
            onClick={emergencyLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    );
  }

  // Handle insufficient role permissions
  if (requiredRole) {
    const userRoleLevel = roleHierarchy[userProfile.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have sufficient permissions to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
