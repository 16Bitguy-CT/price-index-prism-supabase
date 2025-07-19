import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannelFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useChannels() {
  const { userProfile, organizationContext } = useAuth();
  const currentOrgId = organizationContext?.currentOrgId || userProfile?.organization_id;
  
  return useQuery({
    queryKey: ['channels', userProfile?.role, currentOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          organizations!channels_organization_id_fkey (
            id,
            name
          ),
          markets!channels_market_id_fkey (
            id,
            name,
            country
          ),
          channel_segments!channels_segment_id_fkey (
            id,
            segment_type
          )
        `)
        .order('channel_type');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChannelFormData) => {
      // Ensure all required fields are present
      const insertData = {
        channel_type: data.channel_type,
        description: data.description || null,
        segment_id: data.segment_id,
        market_id: data.market_id,
        organization_id: data.organization_id,
        price_index_multiplier: data.price_index_multiplier || null,
        is_active: data.is_active ?? true,
      };

      const { data: result, error } = await supabase
        .from('channels')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast({
        title: "Success",
        description: "Channel created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChannelFormData> }) => {
      const { data: result, error } = await supabase
        .from('channels')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast({
        title: "Success",
        description: "Channel updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update channel.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast({
        title: "Success",
        description: "Channel deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete channel.",
        variant: "destructive",
      });
    },
  });
}
