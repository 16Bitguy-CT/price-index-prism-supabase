
import { useAuth } from '@/contexts/AuthContext';

/**
 * Centralized hook for profile management
 * This ensures all components use the same source of truth for user profile data
 */
export function useProfile() {
  const { 
    userProfile, 
    profileLoading, 
    profileError, 
    refreshProfile,
    user,
    session 
  } = useAuth();

  const isAuthenticated = !!user && !!session;
  const hasProfile = !!userProfile;
  const isProfileReady = isAuthenticated && hasProfile && !profileLoading;
  
  // Profile status helpers
  const profileStatus = {
    loading: profileLoading,
    error: profileError,
    missing: isAuthenticated && !hasProfile && !profileLoading,
    ready: isProfileReady,
  };

  return {
    // Profile data
    profile: userProfile,
    
    // Status flags
    isAuthenticated,
    hasProfile,
    isProfileReady,
    profileStatus,
    
    // Actions
    refreshProfile,
    
    // For convenience, expose commonly used profile fields
    role: userProfile?.role,
    organizationId: userProfile?.organization_id,
    marketId: userProfile?.market_id,
    organization: userProfile?.organizations,
    market: userProfile?.markets,
  };
}
