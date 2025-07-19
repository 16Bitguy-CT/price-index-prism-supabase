import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const emergencySetupSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum(['super_user', 'power_user', 'market_admin', 'representative']),
});

type EmergencySetupFormData = z.infer<typeof emergencySetupSchema>;

const isAngleOrangeUser = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith('@angleorange.com');
};

export default function EmergencySetup() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = React.useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('');
  const [markets, setMarkets] = React.useState<any[]>([]);
  const [selectedMarketId, setSelectedMarketId] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EmergencySetupFormData>({
    resolver: zodResolver(emergencySetupSchema),
    defaultValues: {
      first_name: user?.user_metadata?.first_name || '',
      last_name: user?.user_metadata?.last_name || '',
      role: 'representative',
    },
  });

  // Check domain authorization
  React.useEffect(() => {
    if (user && !isAngleOrangeUser(user.email)) {
      console.log('Unauthorized emergency setup access attempt:', user.email);
      toast({
        title: "Access Denied",
        description: "Emergency setup is only available for AngleOrange employees.",
        variant: "destructive",
      });
    }
  }, [user]);

  React.useEffect(() => {
    fetchOrganizations();
  }, []);

  React.useEffect(() => {
    if (selectedOrgId) {
      fetchMarkets(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, brand_name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
      
      // Auto-select first org if only one exists
      if (data && data.length === 1) {
        setSelectedOrgId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    }
  };

  const fetchMarkets = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id, name, country')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMarkets(data || []);
      
      // Auto-select first market if only one exists
      if (data && data.length === 1) {
        setSelectedMarketId(data[0].id);
      } else {
        setSelectedMarketId('none');
      }
    } catch (error: any) {
      console.error('Error fetching markets:', error);
      setMarkets([]);
    }
  };

  const onSubmit = async (data: EmergencySetupFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "No authenticated user found",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOrgId) {
      toast({
        title: "Error",
        description: "Please select an organization",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Creating profile for user:', user.id);
      
      const profileData = {
        user_id: user.id,
        email: user.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        organization_id: selectedOrgId,
        market_id: selectedMarketId === 'none' ? null : selectedMarketId || null,
        is_active: true,
      };

      console.log('Profile data:', profileData);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      console.log('Profile created successfully:', profile);

      toast({
        title: "Success!",
        description: "Your profile has been created successfully.",
      });

      // Refresh the profile in the auth context
      await refreshProfile();

      // Navigate to main app
      navigate('/');
    } catch (error: any) {
      console.error('Emergency setup failed:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You must be logged in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Domain restriction check
  if (!isAngleOrangeUser(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Restricted</CardTitle>
            <CardDescription>
              Emergency profile setup is only available for AngleOrange employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This emergency setup page is restricted to users with @angleorange.com email addresses.
            </p>
            <p className="text-sm text-muted-foreground">
              Your current email: <span className="font-mono">{user.email}</span>
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">What to do:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Contact your system administrator for profile setup</li>
                <li>Use your AngleOrange email address if you have one</li>
                <li>Request access through proper channels</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/auth/login')}
                className="flex-1"
              >
                Back to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Emergency Profile Setup</CardTitle>
          <CardDescription>
            Your profile is missing or incomplete. Please complete this setup to access the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  className="mt-1"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  className="mt-1"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value) => setValue('role', value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="representative">Representative</SelectItem>
                  <SelectItem value="market_admin">Market Admin</SelectItem>
                  <SelectItem value="power_user">Power User</SelectItem>
                  <SelectItem value="super_user">Super User</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="organization">Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.brand_name || org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {markets.length > 0 && (
              <div>
                <Label htmlFor="market">Market (Optional)</Label>
                <Select value={selectedMarketId} onValueChange={setSelectedMarketId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific market</SelectItem>
                    {markets.map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.name} ({market.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedOrgId}
                className="flex-1"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auth/login')}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
