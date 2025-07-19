
import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back to the Price Index Management System"
    >
      <LoginForm />
    </AuthLayout>
  );
}
