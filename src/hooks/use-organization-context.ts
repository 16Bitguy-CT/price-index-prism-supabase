import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useOrganizationContext() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const switchOrganizationMutation = useMutation({
    mutationFn: async (targetOrgId: string) => {
      const { data, error } = await supabase.rpc('switch_organization_context', {
        target_org_id: targetOrgId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate specific queries to refetch with new context
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['channel-segments'] });
      toast({
        title: "Organization Context Switched",
        description: "You are now viewing data for the selected organization.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization context.",
        variant: "destructive",
      });
    },
  });

  const resetOrganizationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reset_organization_context');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate specific queries to refetch with home organization context
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['channel-segments'] });
      toast({
        title: "Returned to Home Organization",
        description: "You are now viewing your home organization's data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset organization context.",
        variant: "destructive",
      });
    },
  });

  const isSuperUser = userProfile?.role === 'super_user';

  return {
    switchToOrganization: switchOrganizationMutation.mutateAsync,
    resetToHomeOrganization: resetOrganizationMutation.mutateAsync,
    isLoading: switchOrganizationMutation.isPending || resetOrganizationMutation.isPending,
    isSuperUser,
  };
}