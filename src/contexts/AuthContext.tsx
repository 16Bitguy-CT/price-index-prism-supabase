
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from '@/types/auth';
import { LoginFormData, SignupFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Separate loading states to fix race conditions
  const [authLoading, setAuthLoading] = useState(true); // Initial auth check
  const [operationLoading, setOperationLoading] = useState(false); // Login/logout operations
  const [profileLoading, setProfileLoading] = useState(false); // Profile fetching
  
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string, showToast: boolean = false) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      console.log('Fetching profile for user:', userId);
      
      // Use maybeSingle() instead of single() to handle missing profiles gracefully
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            slug,
            brand_name
          ),
          markets:market_id (
            id,
            name,
            country,
            currency
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        const errorMsg = `Profile fetch failed: ${error.message}`;
        setProfileError(errorMsg);
        
        if (showToast) {
          toast({
            title: "Profile Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
        return null;
      }

      if (!data) {
        console.log('No profile found for user:', userId);
        const errorMsg = 'No profile found for this user';
        setProfileError(errorMsg);
        
        if (showToast) {
          toast({
            title: "Profile Missing",
            description: "Your user profile was not found. You can create it using the emergency setup.",
            variant: "destructive",
          });
        }
        return null;
      }

      console.log('Profile fetched successfully:', data);
      setUserProfile(data as UserProfile);
      setProfileError(null);
      return data;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      const errorMsg = error.message || 'Unknown profile error';
      setProfileError(errorMsg);
      
      if (showToast) {
        toast({
          title: "Profile Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, true);
    }
  };

  const emergencyLogout = async () => {
    try {
      console.log('Emergency logout triggered');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setProfileError(null);
      setError(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out due to profile issues.",
      });
    } catch (error: any) {
      console.error('Emergency logout failed:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch profile but don't show toast on initial load
        fetchUserProfile(session.user.id, false).finally(() => {
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch profile if we don't already have one or if it's a different user
          if (!userProfile || userProfile.user_id !== session.user.id) {
            // Use setTimeout to prevent blocking the auth state change
            setTimeout(() => {
              fetchUserProfile(session.user.id, true);
            }, 0);
          }
        } else {
          setUserProfile(null);
          setProfileError(null);
        }
        
        // Auth loading is done after auth state change
        if (authLoading) {
          setAuthLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [userProfile?.user_id, authLoading]);

  const login = async ({ email, password }: LoginFormData) => {
    try {
      setOperationLoading(true);
      setError(null);
      setProfileError(null);

      console.log('Attempting login for:', email);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful');
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred during login';
      console.error('Login failed:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setOperationLoading(false);
    }
  };

  const signup = async ({ email, password, first_name, last_name }: SignupFormData) => {
    try {
      setOperationLoading(true);
      setError(null);
      setProfileError(null);

      console.log('Starting signup process for:', email);

      // First, validate email domain and find organization
      const { data: orgId, error: domainError } = await supabase.rpc(
        'get_organization_by_email_domain',
        { email_address: email }
      );

      if (domainError || !orgId) {
        throw new Error('Email domain not allowed. Please contact your administrator.');
      }

      // Get organization details
      const { data: organization, error: orgDetailError } = await supabase
        .from('organizations')
        .select('id, name, requires_approval, markets(id)')
        .eq('id', orgId)
        .single();

      if (orgDetailError || !organization) {
        throw new Error('Organization not found');
      }

      const marketId = organization.markets?.[0]?.id || null;

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name,
            last_name,
          },
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
        return;
      }

      // If user is immediately logged in, create profile with approval status
      if (data.user && data.session) {
        console.log('User logged in immediately, creating profile...');
        
        try {
          console.log('Creating profile with org:', organization.id, 'market:', marketId);
          
          // Create user profile with approval workflow
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              first_name,
              last_name,
              role: 'representative',
              organization_id: organization.id,
              market_id: marketId,
              is_active: !organization.requires_approval,
              approval_status: organization.requires_approval ? 'pending' : 'approved',
              approved_at: organization.requires_approval ? null : new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.error('Profile creation failed:', profileError);
            
            toast({
              title: "Signup successful, but profile creation failed",
              description: "You can complete your profile setup using the emergency setup page.",
              variant: "destructive",
            });
            return;
          }

          console.log('Profile created successfully:', profileData);
          
          if (organization.requires_approval) {
            toast({
              title: "Account Created",
              description: "Your account is pending approval. You'll receive an email when approved.",
            });
          } else {
            toast({
              title: "Account created!",
              description: "Welcome to the Price Index Management System.",
            });
          }
        } catch (profileCreationError: any) {
          console.error('Profile creation process failed:', profileCreationError);
          
          toast({
            title: "Signup completed with issues",
            description: `Your account was created but there was an issue setting up your profile: ${profileCreationError.message}. You can complete the setup using the emergency setup page.`,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred during signup';
      console.error('Signup failed:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setOperationLoading(false);
    }
  };

  const logout = async () => {
    try {
      setOperationLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserProfile(null);
      setError(null);
      setProfileError(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading: authLoading, // Keep for backward compatibility, but mainly for initial load
    operationLoading, // New: for login/logout operations
    profileLoading, // New: for profile fetching
    error,
    profileError, // New: separate profile errors
    login,
    signup,
    logout,
    refreshProfile,
    emergencyLogout, // New: emergency logout when stuck
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
