
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutletFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';

export function useOutlets() {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlets')
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          ),
          channels:channel_id (
            id,
            channel_type,
            segment_id,
            channel_segments:segment_id (
              id,
              segment_type
            )
          )
        `)
        .order('outlet_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OutletFormData) => {
      const { data: result, error } = await supabase
        .from('outlets')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast({
        title: "Success",
        description: "Outlet created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create outlet.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OutletFormData> }) => {
      const { data: result, error } = await supabase
        .from('outlets')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast({
        title: "Success",
        description: "Outlet updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update outlet.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('outlets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast({
        title: "Success",
        description: "Outlet deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete outlet.",
        variant: "destructive",
      });
    },
  });
}
