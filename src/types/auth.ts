
import { User, Session } from '@supabase/supabase-js';

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

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
