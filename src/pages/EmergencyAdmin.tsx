import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Users, Building, RefreshCw, UserCheck, UserX } from 'lucide-react';

interface SystemHealth {
  total_users: number;
  active_users: number;
  pending_users: number;
  orphaned_users: number;
  total_organizations: number;
  active_organizations: number;
  total_markets: number;
  active_markets: number;
}

interface OrphanedUser {
  user_id: string;
  email: string;
  action_taken: string;
}

export default function EmergencyAdmin() {
  const { isAuthenticated, role } = useProfile();
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);

  // Redirect if not super user
  useEffect(() => {
    if (isAuthenticated && role !== 'super_user') {
      toast({
        title: "Access Denied",
        description: "This page is only accessible to super users.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAuthenticated, role, navigate]);

  const fetchSystemHealth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_system_health');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSystemHealth(data[0] as SystemHealth);
      }
    } catch (error: any) {
      console.error('Error fetching system health:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system health data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixOrphanedUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('emergency_fix_orphaned_users');
      
      if (error) throw error;
      
      setOrphanedUsers(data || []);
      
      const successCount = data?.filter(u => u.action_taken === 'Profile created automatically').length || 0;
      
      toast({
        title: "Orphaned Users Fixed",
        description: `Successfully created profiles for ${successCount} orphaned users.`,
      });
      
      // Refresh system health after fixing
      await fetchSystemHealth();
    } catch (error: any) {
      console.error('Error fixing orphaned users:', error);
      toast({
        title: "Error",
        description: "Failed to fix orphaned users: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'super_user') {
      fetchSystemHealth();
    }
  }, [isAuthenticated, role]);

  if (!isAuthenticated || role !== 'super_user') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This emergency admin page is only accessible to super users.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="mt-4 w-full"
              variant="outline"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Emergency Admin
          </h1>
          <p className="text-muted-foreground">
            System health monitoring and emergency user management
          </p>
        </div>
        <Button 
          onClick={fetchSystemHealth}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.total_users || 0}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="default" className="text-xs">
                {systemHealth?.active_users || 0} active
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {systemHealth?.pending_users || 0} pending
              </Badge>
              {(systemHealth?.orphaned_users || 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {systemHealth?.orphaned_users} orphaned
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.total_organizations || 0}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="default" className="text-xs">
                {systemHealth?.active_organizations || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Markets</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.total_markets || 0}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="default" className="text-xs">
                {systemHealth?.active_markets || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(systemHealth?.orphaned_users || 0) === 0 ? (
                <span className="text-green-600">Good</span>
              ) : (
                <span className="text-red-600">Issues</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {(systemHealth?.orphaned_users || 0) === 0 
                ? 'No critical issues detected'
                : `${systemHealth?.orphaned_users} orphaned users need attention`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Actions</CardTitle>
          <CardDescription>
            Use these tools to fix system issues and manage users in emergency situations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={fixOrphanedUsers}
              disabled={isLoading || (systemHealth?.orphaned_users || 0) === 0}
              variant="outline"
              className="flex-1"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Fix Orphaned Users ({systemHealth?.orphaned_users || 0})
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/users')}
              variant="outline"
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
            
            <Button 
              onClick={() => navigate('/emergency-setup')}
              variant="outline"
              className="flex-1"
            >
              <UserX className="h-4 w-4 mr-2" />
              Emergency Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orphaned Users Results */}
      {orphanedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orphaned Users Fix Results</CardTitle>
            <CardDescription>
              Results from the last orphaned users fix operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphanedUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-mono text-sm">{user.email}</div>
                    <div className="text-xs text-muted-foreground">ID: {user.user_id}</div>
                  </div>
                  <Badge 
                    variant={user.action_taken === 'Profile created automatically' ? 'default' : 'secondary'}
                  >
                    {user.action_taken}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Emergency Admin Dashboard - Use with caution</p>
        <p>All actions are logged and auditable</p>
      </div>
    </div>
  );
}