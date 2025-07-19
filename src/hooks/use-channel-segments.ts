import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannelSegmentFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useChannelSegments() {
  const { userProfile, organizationContext } = useAuth();
  const currentOrgId = organizationContext?.currentOrgId || userProfile?.organization_id;
  
  return useQuery({
    queryKey: ['channel-segments', userProfile?.role, currentOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channel_segments')
        .select(`
          *,
          organizations!channel_segments_organization_id_fkey (
            id,
            name
          ),
          markets!channel_segments_market_id_fkey (
            id,
            name,
            country
          )
        `)
        .order('segment_type');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateChannelSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChannelSegmentFormData) => {
      // Ensure all required fields are present
      const insertData = {
        segment_type: data.segment_type,
        market_id: data.market_id,
        organization_id: data.organization_id,
        is_active: data.is_active ?? true,
      };

      const { data: result, error } = await supabase
        .from('channel_segments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-segments'] });
      toast({
        title: "Success",
        description: "Channel segment created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel segment.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateChannelSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChannelSegmentFormData> }) => {
      const { data: result, error } = await supabase
        .from('channel_segments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-segments'] });
      toast({
        title: "Success",
        description: "Channel segment updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update channel segment.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteChannelSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('channel_segments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-segments'] });
      toast({
        title: "Success",
        description: "Channel segment deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete channel segment.",
        variant: "destructive",
      });
    },
  });
}
