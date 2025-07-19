
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Plus, Edit, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '@/hooks/use-channels';
import { useChannelSegments } from '@/hooks/use-channel-segments';
import { useMarkets } from '@/hooks/use-markets';
import { useOrganizations } from '@/hooks/use-organizations';
import { ChannelFormData, channelSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Channel = {
  id: string;
  channel_type: string;
  description: string | null;
  segment_id: string;
  market_id: string;
  organization_id: string;
  price_index_multiplier: number | null;
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
  channel_segments: {
    id: string;
    segment_type: string;
  } | null;
};

function ChannelForm({ 
  channel, 
  onSuccess 
}: { 
  channel?: Channel; 
  onSuccess: () => void;
}) {
  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const { data: organizations = [] } = useOrganizations();
  const { data: markets = [] } = useMarkets();
  const { data: segments = [] } = useChannelSegments();
  
  const form = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      channel_type: channel?.channel_type || '',
      description: channel?.description || '',
      segment_id: channel?.segment_id || '',
      market_id: channel?.market_id || '',
      organization_id: channel?.organization_id || '',
      price_index_multiplier: channel?.price_index_multiplier || undefined,
      is_active: channel?.is_active ?? true,
    },
  });

  const onSubmit = async (data: ChannelFormData) => {
    try {
      if (channel) {
        await updateMutation.mutateAsync({ id: channel.id, data });
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
          name="channel_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Type</FormLabel>
              <FormControl>
                <Input placeholder="Enter channel type" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter channel description"
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
          name="segment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Segment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a segment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.segment_type}
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
          name="price_index_multiplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price Index Multiplier</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
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
                  Enable or disable this channel
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
            {isLoading ? (channel ? 'Updating...' : 'Creating...') : (channel ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ChannelManagement() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: channels = [], isLoading } = useChannels();
  const deleteMutation = useDeleteChannel();

  const columns: ColumnDef<Channel>[] = [
    {
      accessorKey: 'channel_type',
      header: 'Channel Type',
    },
    {
      accessorKey: 'channel_segments.segment_type',
      header: 'Segment',
      cell: ({ row }) => row.original.channel_segments?.segment_type || '-',
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
      accessorKey: 'price_index_multiplier',
      header: 'Price Multiplier',
      cell: ({ row }) => row.original.price_index_multiplier || '-',
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
        const channel = row.original;
        
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
                  setSelectedChannel(channel);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteConfirmDialog
                  title="Delete Channel"
                  description="Are you sure you want to delete this channel? This action cannot be undone and will affect all related outlets."
                  onConfirm={() => deleteMutation.mutate(channel.id)}
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
    setSelectedChannel(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Management"
        description="Manage distribution channels and their configurations"
        actions={
          <FormDialog
            title={selectedChannel ? "Edit Channel" : "Create Channel"}
            trigger={
              <Button onClick={() => setSelectedChannel(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            }
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          >
            <ChannelForm 
              channel={selectedChannel}
              onSuccess={handleFormSuccess}
            />
          </FormDialog>
        }
      />
      
      <DataTable
        columns={columns}
        data={channels}
        searchKey="channel_type"
        searchPlaceholder="Search channels..."
        isLoading={isLoading}
      />
    </div>
  );
}
