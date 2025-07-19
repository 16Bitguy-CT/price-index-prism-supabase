
import { User, Session } from '@supabase/supabase-js';
import { LoginFormData, SignupFormData } from '@/lib/validations';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: 'super_user' | 'power_user' | 'market_admin' | 'representative';
  organization_id: string;
  market_id: string | null;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by_user_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations (when joined)
  organizations?: {
    id: string;
    name: string;
    slug: string;
    brand_name: string | null;
  };
  markets?: {
    id: string;
    name: string;
    country: string;
    currency: string;
  };
}

export interface OrganizationContext {
  homeOrgId: string;
  currentOrgId: string;
  isContextSwitched: boolean;
  switchToOrganization: (orgId: string) => Promise<void>;
  resetToHomeOrganization: () => Promise<void>;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean; // Initial auth loading
  operationLoading?: boolean; // Login/logout operations
  profileLoading?: boolean; // Profile fetching
  error: string | null;
  profileError?: string | null; // Separate profile errors
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  emergencyLogout?: () => Promise<void>; // Emergency logout when stuck
  organizationContext?: OrganizationContext; // Organization context for super users
}
