
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLogAdminAction } from './use-admin-audit';

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_user' | 'power_user' | 'market_admin' | 'representative';
  organization_id: string;
  market_id?: string;
  is_active: boolean;
}

export interface UserActionData {
  userId: string;
  reason?: string;
}

export interface ChangeRoleData extends UserActionData {
  newRole: 'super_user' | 'power_user' | 'market_admin' | 'representative';
}

export interface BulkOperationData {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'change_role';
  newRole?: 'super_user' | 'power_user' | 'market_admin' | 'representative';
  reason?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: Math.random().toString(36).slice(-8) + '!', // Temporary password
        email_confirm: true,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      });

      if (authError) throw authError;

      // Then create the user profile using the emergency function
      const { data: profile, error: profileError } = await supabase.rpc(
        'emergency_create_profile',
        {
          target_user_id: authData.user.id,
          email_address: data.email,
          first_name_param: data.first_name,
          last_name_param: data.last_name,
          role_param: data.role,
          organization_id_param: data.organization_id,
          market_id_param: data.market_id || null,
        }
      );

      if (profileError) throw profileError;

      return { user: authData.user, profile };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      
      logAction.mutate({
        action: 'create_user',
        targetUserId: result.user.id,
        details: {
          email: variables.email,
          role: variables.role,
          organization_id: variables.organization_id,
          market_id: variables.market_id,
        },
      });

      toast({
        title: "Success",
        description: "User created successfully. A temporary password has been generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async ({ userId, reason }: UserActionData) => {
      const { data, error } = await supabase.rpc('emergency_activate_user', {
        target_user_id: userId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      
      logAction.mutate({
        action: 'activate_user',
        targetUserId: variables.userId,
        details: { activated: true },
        reason: variables.reason,
      });

      toast({
        title: "Success",
        description: "User activated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate user.",
        variant: "destructive",
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async ({ userId, reason }: UserActionData) => {
      const { data, error } = await supabase.rpc('emergency_deactivate_user', {
        target_user_id: userId,
        reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      
      logAction.mutate({
        action: 'deactivate_user',
        targetUserId: variables.userId,
        details: { activated: false },
        reason: variables.reason,
      });

      toast({
        title: "Success",
        description: "User deactivated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user.",
        variant: "destructive",
      });
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async ({ userId, newRole, reason }: ChangeRoleData) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      
      logAction.mutate({
        action: 'change_role',
        targetUserId: variables.userId,
        details: { 
          old_role: result.role,
          new_role: variables.newRole 
        },
        reason: variables.reason,
      });

      toast({
        title: "Success",
        description: "User role changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change user role.",
        variant: "destructive",
      });
    },
  });
}

export function useBulkUserOperation() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const changeRole = useChangeUserRole();

  return useMutation({
    mutationFn: async ({ userIds, operation, newRole, reason }: BulkOperationData) => {
      const results = [];
      
      for (const userId of userIds) {
        try {
          switch (operation) {
            case 'activate':
              await activateUser.mutateAsync({ userId, reason });
              break;
            case 'deactivate':
              await deactivateUser.mutateAsync({ userId, reason });
              break;
            case 'change_role':
              if (newRole) {
                await changeRole.mutateAsync({ userId, newRole, reason });
              }
              break;
          }
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error });
        }
      }

      return results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logAction.mutate({
        action: 'bulk_operation',
        details: {
          operation: variables.operation,
          user_count: variables.userIds.length,
          success_count: successCount,
          failure_count: failureCount,
          new_role: variables.newRole,
        },
        reason: variables.reason,
      });

      toast({
        title: "Bulk Operation Complete",
        description: `${successCount} users processed successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Bulk operation failed.",
        variant: "destructive",
      });
    },
  });
}
