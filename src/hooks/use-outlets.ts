import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutletFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useOutlets() {
  const { userProfile, organizationContext } = useAuth();
  const currentOrgId = organizationContext?.currentOrgId || userProfile?.organization_id;
  
  return useQuery({
    queryKey: ['outlets', userProfile?.role, currentOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outlets')
        .select(`
          *,
          organizations!outlets_organization_id_fkey (
            id,
            name
          ),
          channels!outlets_channel_id_fkey (
            id,
            channel_type,
            segment_id,
            channel_segments!channels_segment_id_fkey (
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
      // Ensure all required fields are present
      const insertData = {
        outlet_name: data.outlet_name,
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        channel_id: data.channel_id,
        organization_id: data.organization_id,
        is_active: data.is_active ?? true,
      };

      const { data: result, error } = await supabase
        .from('outlets')
        .insert(insertData)
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
