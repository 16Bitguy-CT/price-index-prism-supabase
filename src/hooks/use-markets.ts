
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useMarkets() {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['markets', userProfile?.role, userProfile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('markets')
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            brand_name
          )
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarketFormData) => {
      // Ensure all required fields are present
      const insertData = {
        name: data.name,
        country: data.country,
        currency: data.currency,
        organization_id: data.organization_id,
        is_active: data.is_active ?? true,
      };

      const { data: result, error } = await supabase
        .from('markets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast({
        title: "Success",
        description: "Market created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create market.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MarketFormData> }) => {
      const { data: result, error } = await supabase
        .from('markets')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast({
        title: "Success",
        description: "Market updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update market.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      toast({
        title: "Success",
        description: "Market deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete market.",
        variant: "destructive",
      });
    },
  });
}
