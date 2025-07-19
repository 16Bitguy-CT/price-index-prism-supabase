
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Plus, Edit, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useOutlets, useCreateOutlet, useUpdateOutlet, useDeleteOutlet } from '@/hooks/use-outlets';
import { useChannels } from '@/hooks/use-channels';
import { useOrganizations } from '@/hooks/use-organizations';
import { OutletFormData, outletSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Outlet = {
  id: string;
  outlet_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  channel_id: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizations: {
    id: string;
    name: string;
  } | null;
  channels: {
    id: string;
    channel_type: string;
    segment_id: string;
    channel_segments: {
      id: string;
      segment_type: string;
    } | null;
  } | null;
};

function OutletForm({ 
  outlet, 
  onSuccess 
}: { 
  outlet?: Outlet; 
  onSuccess: () => void;
}) {
  const createMutation = useCreateOutlet();
  const updateMutation = useUpdateOutlet();
  const { data: organizations = [] } = useOrganizations();
  const { data: channels = [] } = useChannels();
  
  const form = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      outlet_name: outlet?.outlet_name || '',
      contact_person: outlet?.contact_person || '',
      phone: outlet?.phone || '',
      email: outlet?.email || '',
      address: outlet?.address || '',
      channel_id: outlet?.channel_id || '',
      organization_id: outlet?.organization_id || '',
      is_active: outlet?.is_active ?? true,
    },
  });

  const onSubmit = async (data: OutletFormData) => {
    try {
      if (outlet) {
        await updateMutation.mutateAsync({ id: outlet.id, data });
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
        <FormField
          control={form.control}
          name="outlet_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outlet Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter outlet name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Contact person name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
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
                <Input type="email" placeholder="contact@outlet.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter outlet address"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
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
          name="channel_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.channel_type} - {channel.channel_segments?.segment_type}
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
                  Enable or disable this outlet
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
            {isLoading ? (outlet ? 'Updating...' : 'Creating...') : (outlet ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function OutletManagement() {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: outlets = [], isLoading } = useOutlets();
  const deleteMutation = useDeleteOutlet();

  const columns: ColumnDef<Outlet>[] = [
    {
      accessorKey: 'outlet_name',
      header: 'Outlet Name',
    },
    {
      accessorKey: 'contact_person',
      header: 'Contact Person',
      cell: ({ row }) => row.original.contact_person || '-',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'channels.channel_type',
      header: 'Channel',
      cell: ({ row }) => {
        const channel = row.original.channels;
        return channel ? `${channel.channel_type} (${channel.channel_segments?.segment_type})` : '-';
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
        const outlet = row.original;
        
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
                  setSelectedOutlet(outlet);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteConfirmDialog
                  title="Delete Outlet"
                  description="Are you sure you want to delete this outlet? This action cannot be undone."
                  onConfirm={() => deleteMutation.mutate(outlet.id)}
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
    setSelectedOutlet(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outlet Management"
        description="Manage outlets and their contact information"
        actions={
          <FormDialog
            title={selectedOutlet ? "Edit Outlet" : "Create Outlet"}
            trigger={
              <Button onClick={() => setSelectedOutlet(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Outlet
              </Button>
            }
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          >
            <OutletForm 
              outlet={selectedOutlet}
              onSuccess={handleFormSuccess}
            />
          </FormDialog>
        }
      />
      
      <DataTable
        columns={columns}
        data={outlets}
        searchKey="outlet_name"
        searchPlaceholder="Search outlets..."
        isLoading={isLoading}
      />
    </div>
  );
}
