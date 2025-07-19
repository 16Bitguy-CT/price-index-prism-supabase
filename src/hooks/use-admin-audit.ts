
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AdminAction = 'create_user' | 'update_user' | 'activate_user' | 'deactivate_user' | 'change_role' | 'delete_user' | 'bulk_operation';

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  target_user_id?: string;
  action: AdminAction;
  details: Record<string, any>;
  reason?: string;
  ip_address?: string;
  created_at: string;
  admin_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  target_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function useAdminAuditLog() {
  return useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      try {
        // Simple query to admin_audit_log without complex joins to avoid TypeScript issues
        const { data, error } = await supabase
          .from('admin_audit_log' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return ((data as unknown) || []) as AuditLogEntry[];
      } catch (error) {
        // If the table doesn't exist yet, return empty array
        console.warn('Admin audit log table not available:', error);
        return [] as AuditLogEntry[];
      }
    },
  });
}

export function useLogAdminAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      targetUserId,
      details,
      reason,
    }: {
      action: AdminAction;
      targetUserId?: string;
      details: Record<string, any>;
      reason?: string;
    }) => {
      // Use raw insert since TypeScript types haven't been regenerated yet
      const { data, error } = await supabase
        .from('admin_audit_log' as any)
        .insert({
          action,
          target_user_id: targetUserId,
          details,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
  });
}
