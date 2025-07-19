
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfileFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useUserProfiles() {
  const { userProfile, organizationContext } = useAuth();
  const currentOrgId = organizationContext?.currentOrgId || userProfile?.organization_id;
  
  return useQuery({
    queryKey: ['user-profiles', userProfile?.role, currentOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations!user_profiles_organization_id_fkey (
            id,
            name,
            brand_name
          ),
          markets!user_profiles_market_id_fkey (
            id,
            name,
            country
          )
        `)
        .order('first_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserProfileFormData> }) => {
      const { data: result, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Success",
        description: "User profile updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile.",
        variant: "destructive",
      });
    },
  });
}
