
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Plus, Edit, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '@/hooks/use-organizations';
import { OrganizationFormData, organizationSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Organization = {
  id: string;
  name: string;
  slug: string;
  brand_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  primary_domain: string | null;
  third_party_domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function OrganizationForm({ 
  organization, 
  onSuccess 
}: { 
  organization?: Organization; 
  onSuccess: () => void;
}) {
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      slug: organization?.slug || '',
      brand_name: organization?.brand_name || '',
      primary_color: organization?.primary_color || '',
      secondary_color: organization?.secondary_color || '',
      logo_url: organization?.logo_url || '',
      primary_domain: organization?.primary_domain || '',
      third_party_domain: organization?.third_party_domain || '',
      is_active: organization?.is_active ?? true,
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      if (organization) {
        await updateMutation.mutateAsync({ id: organization.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter organization name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="organization-slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="brand_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder="Brand display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="primary_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Color</FormLabel>
                <FormControl>
                  <Input placeholder="#000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secondary_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Color</FormLabel>
                <FormControl>
                  <Input placeholder="#ffffff" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="primary_domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Domain</FormLabel>
                <FormControl>
                  <Input placeholder="example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="third_party_domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Third Party Domain</FormLabel>
                <FormControl>
                  <Input placeholder="api.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this organization
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
            {isLoading ? (organization ? 'Updating...' : 'Creating...') : (organization ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function OrganizationManagement() {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: organizations = [], isLoading } = useOrganizations();
  const deleteMutation = useDeleteOrganization();

  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'brand_name',
      header: 'Brand Name',
      cell: ({ row }) => row.original.brand_name || '-',
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
        const organization = row.original;
        
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
                  setSelectedOrganization(organization);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteConfirmDialog
                  title="Delete Organization"
                  description="Are you sure you want to delete this organization? This action cannot be undone and will affect all related data."
                  onConfirm={() => deleteMutation.mutate(organization.id)}
                  isLoading={deleteMutation.isPending}
                  trigger={
                    <div className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                      Delete
                    </div>
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedOrganization(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Management"
        description="Manage organizations and their configurations"
        actions={
          <FormDialog
            title={selectedOrganization ? "Edit Organization" : "Create Organization"}
            trigger={
              <Button onClick={() => setSelectedOrganization(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            }
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          >
            <OrganizationForm 
              organization={selectedOrganization}
              onSuccess={handleFormSuccess}
            />
          </FormDialog>
        }
      />
      
      <DataTable
        columns={columns}
        data={organizations}
        searchKey="name"
        searchPlaceholder="Search organizations..."
        isLoading={isLoading}
      />
    </div>
  );
}
