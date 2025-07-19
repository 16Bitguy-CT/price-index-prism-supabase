
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {userProfile?.first_name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Price Index Management System Dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Your current organization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {userProfile?.organizations?.name || 'Not assigned'}
            </p>
            {userProfile?.organizations?.brand_name && (
              <p className="text-sm text-muted-foreground">
                Brand: {userProfile.organizations.brand_name}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market</CardTitle>
            <CardDescription>Your assigned market</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {userProfile?.markets?.name || 'Not assigned'}
            </p>
            {userProfile?.markets && (
              <p className="text-sm text-muted-foreground">
                {userProfile.markets.country} • {userProfile.markets.currency}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
            <CardDescription>Your access level</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {userProfile?.role.replace('_', ' ')}
            </p>
            <p className="text-sm text-muted-foreground">
              {userProfile?.is_active ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Price management features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
