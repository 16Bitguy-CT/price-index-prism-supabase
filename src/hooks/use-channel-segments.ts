
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChannelSegmentFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';

export function useChannelSegments() {
  return useQuery({
    queryKey: ['channel-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channel_segments')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          ),
          markets:market_id (
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
      const { data: result, error } = await supabase
        .from('channel_segments')
        .insert(data)
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
