
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { RoleBadge } from '@/components/status/RoleBadge';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';
import { CreateUserDialog, UserActionDialog, ChangeRoleDialog } from '@/components/admin/UserActionDialogs';
import { Plus, Edit, MoreHorizontal, Shield, RotateCcw, UserX, Activity } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useUserProfiles, useUpdateUserProfile } from '@/hooks/use-user-profiles';
import { useOrganizations } from '@/hooks/use-organizations';
import { useMarkets } from '@/hooks/use-markets';
import { 
  useCreateUser, 
  useActivateUser, 
  useDeactivateUser, 
  useChangeUserRole,
  CreateUserData 
} from '@/hooks/use-enhanced-user-management';
import { UserProfileFormData, userProfileSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type UserProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: 'super_user' | 'power_user' | 'market_admin' | 'representative';
  organization_id: string;
  market_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizations: {
    id: string;
    name: string;
    brand_name: string | null;
  } | null;
  markets: {
    id: string;
    name: string;
    country: string;
  } | null;
};

function UserProfileForm({ 
  userProfile, 
  onSuccess 
}: { 
  userProfile?: UserProfile; 
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateUserProfile();
  const { data: organizations = [] } = useOrganizations();
  const { data: markets = [] } = useMarkets();
  
  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      email: userProfile?.email || '',
      role: userProfile?.role || 'representative',
      organization_id: userProfile?.organization_id || '',
      market_id: userProfile?.market_id || undefined,
      is_active: userProfile?.is_active ?? true,
    },
  });

  const onSubmit = async (data: UserProfileFormData) => {
    if (!userProfile) return;
    
    try {
      await updateMutation.mutateAsync({ id: userProfile.id, data });
      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="representative">Representative</SelectItem>
                  <SelectItem value="market_admin">Market Admin</SelectItem>
                  <SelectItem value="power_user">Power User</SelectItem>
                  <SelectItem value="super_user">Super User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organization_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="market_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a market (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No specific market</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name} ({market.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this user
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    type: 'activate' | 'deactivate' | 'change_role' | null;
    user: UserProfile | null;
  }>({ type: null, user: null });
  
  const { data: users = [], isLoading } = useUserProfiles();
  const createUser = useCreateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const changeRole = useChangeUserRole();

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      await createUser.mutateAsync(data);
      setIsCreateUserOpen(false);
    } catch (error) {
      // Error handled in the mutation
    }
  };

  const handleUserAction = async (action: string, reason?: string) => {
    if (!actionDialog.user) return;

    try {
      switch (action) {
        case 'activate':
          await activateUser.mutateAsync({ 
            userId: actionDialog.user.user_id, 
            reason 
          });
          break;
        case 'deactivate':
          await deactivateUser.mutateAsync({ 
            userId: actionDialog.user.user_id, 
            reason 
          });
          break;
      }
      setActionDialog({ type: null, user: null });
    } catch (error) {
      // Error handled in the mutations
    }
  };

  const handleRoleChange = async (newRole: string, reason?: string) => {
    if (!actionDialog.user) return;

    try {
      await changeRole.mutateAsync({
        userId: actionDialog.user.user_id,
        newRole: newRole as any,
        reason,
      });
      setActionDialog({ type: null, user: null });
    } catch (error) {
      // Error handled in the mutation
    }
  };

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => {
        const { first_name, last_name } = row.original;
        return `${first_name || ''} ${last_name || ''}`.trim() || '-';
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: 'organizations.name',
      header: 'Organization',
      cell: ({ row }) => row.original.organizations?.name || '-',
    },
    {
      accessorKey: 'markets.name',
      header: 'Market',
      cell: ({ row }) => {
        const market = row.original.markets;
        return market ? `${market.name} (${market.country})` : 'All markets';
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => setActionDialog({ type: 'change_role', user })}
              >
                <Shield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
              
              {user.is_active ? (
                <DropdownMenuItem
                  onClick={() => setActionDialog({ type: 'deactivate', user })}
                  className="text-red-600"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setActionDialog({ type: 'activate', user })}
                  className="text-green-600"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user profiles, roles, and administrative actions"
        actions={
          <Button onClick={() => setIsCreateUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <DataTable
            columns={columns}
            data={users}
            searchKey="email"
            searchPlaceholder="Search users..."
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLog />
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        onSubmit={handleCreateUser}
        isLoading={createUser.isPending}
      />

      {/* Edit User Profile Dialog */}
      <FormDialog
        title="Edit User Profile"
        trigger={<div />}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      >
        <UserProfileForm 
          userProfile={selectedUser}
          onSuccess={handleFormSuccess}
        />
      </FormDialog>

      {/* User Action Dialogs */}
      <UserActionDialog
        open={actionDialog.type === 'activate'}
        onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}
        title="Activate User"
        description={`Are you sure you want to activate ${actionDialog.user?.first_name} ${actionDialog.user?.last_name}? This will restore their access to the system.`}
        onConfirm={(reason) => handleUserAction('activate', reason)}
        isLoading={activateUser.isPending}
        requiresReason={true}
        confirmText="Activate User"
        variant="default"
      />

      <UserActionDialog
        open={actionDialog.type === 'deactivate'}
        onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${actionDialog.user?.first_name} ${actionDialog.user?.last_name}? This will remove their access to the system.`}
        onConfirm={(reason) => handleUserAction('deactivate', reason)}
        isLoading={deactivateUser.isPending}
        requiresReason={true}
        confirmText="Deactivate User"
        variant="destructive"
      />

      <ChangeRoleDialog
        open={actionDialog.type === 'change_role'}
        onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}
        currentRole={actionDialog.user?.role || ''}
        onConfirm={handleRoleChange}
        isLoading={changeRole.isPending}
      />
    </div>
  );
}
