
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Plus, Edit, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useChannelSegments, useCreateChannelSegment, useUpdateChannelSegment, useDeleteChannelSegment } from '@/hooks/use-channel-segments';
import { useMarkets } from '@/hooks/use-markets';
import { useOrganizations } from '@/hooks/use-organizations';
import { ChannelSegmentFormData, channelSegmentSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ChannelSegment = {
  id: string;
  segment_type: string;
  market_id: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizations: {
    id: string;
    name: string;
  } | null;
  markets: {
    id: string;
    name: string;
    country: string;
  } | null;
};

function ChannelSegmentForm({ 
  segment, 
  onSuccess 
}: { 
  segment?: ChannelSegment; 
  onSuccess: () => void;
}) {
  const createMutation = useCreateChannelSegment();
  const updateMutation = useUpdateChannelSegment();
  const { data: organizations = [] } = useOrganizations();
  const { data: markets = [] } = useMarkets();
  
  const form = useForm<ChannelSegmentFormData>({
    resolver: zodResolver(channelSegmentSchema),
    defaultValues: {
      segment_type: segment?.segment_type || '',
      market_id: segment?.market_id || '',
      organization_id: segment?.organization_id || '',
      is_active: segment?.is_active ?? true,
    },
  });

  const onSubmit = async (data: ChannelSegmentFormData) => {
    try {
      if (segment) {
        await updateMutation.mutateAsync({ id: segment.id, data });
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
          name="segment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Segment Type</FormLabel>
              <FormControl>
                <Input placeholder="Enter segment type" {...field} />
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
          name="market_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a market" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
                  Enable or disable this segment
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
            {isLoading ? (segment ? 'Updating...' : 'Creating...') : (segment ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function SegmentManagement() {
  const [selectedSegment, setSelectedSegment] = useState<ChannelSegment | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: segments = [], isLoading } = useChannelSegments();
  const deleteMutation = useDeleteChannelSegment();

  const columns: ColumnDef<ChannelSegment>[] = [
    {
      accessorKey: 'segment_type',
      header: 'Segment Type',
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
        return market ? `${market.name} (${market.country})` : '-';
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
        const segment = row.original;
        
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
                  setSelectedSegment(segment);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteConfirmDialog
                  title="Delete Channel Segment"
                  description="Are you sure you want to delete this channel segment? This action cannot be undone and will affect all related channels."
                  onConfirm={() => deleteMutation.mutate(segment.id)}
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
    setSelectedSegment(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segment Management"
        description="Manage market segments and their categorizations"
        actions={
          <FormDialog
            title={selectedSegment ? "Edit Channel Segment" : "Create Channel Segment"}
            trigger={
              <Button onClick={() => setSelectedSegment(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Segment
              </Button>
            }
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          >
            <ChannelSegmentForm 
              segment={selectedSegment}
              onSuccess={handleFormSuccess}
            />
          </FormDialog>
        }
      />
      
      <DataTable
        columns={columns}
        data={segments}
        searchKey="segment_type"
        searchPlaceholder="Search segments..."
        isLoading={isLoading}
      />
    </div>
  );
}
