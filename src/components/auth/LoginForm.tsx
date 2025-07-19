
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, LoginFormData } from '@/lib/validations';

export function LoginForm() {
  const { 
    login, 
    operationLoading, 
    profileLoading, 
    profileError, 
    emergencyLogout,
    user,
    userProfile 
  } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      
      // Wait a moment for profile to load before navigating
      setTimeout(() => {
        // Only navigate if we have a profile or if profile loading is done
        if (userProfile || !profileLoading) {
          navigate('/');
        }
      }, 1000);
    } catch (error) {
      // Error is handled in the context
    }
  };

  // Show different loading states
  const getButtonText = () => {
    if (operationLoading) return 'Signing in...';
    if (profileLoading && user) return 'Loading profile...';
    return 'Sign in';
  };

  const isLoading = operationLoading || (profileLoading && user);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {getButtonText()}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>

      {/* Session Recovery - Show when auth succeeded but profile failed */}
      {user && profileError && emergencyLogout && (
        <div className="mt-6 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <h3 className="text-sm font-medium text-destructive mb-2">
            Profile Loading Issue
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            You're logged in but we couldn't load your profile. This might be a temporary issue.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={emergencyLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
