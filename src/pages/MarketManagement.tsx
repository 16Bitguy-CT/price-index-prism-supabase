
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Plus, Edit, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useMarkets, useCreateMarket, useUpdateMarket, useDeleteMarket } from '@/hooks/use-markets';
import { useOrganizations } from '@/hooks/use-organizations';
import { MarketFormData, marketSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Market = {
  id: string;
  name: string;
  country: string;
  currency: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organizations: {
    id: string;
    name: string;
    brand_name: string | null;
  } | null;
};

function MarketForm({ 
  market, 
  onSuccess 
}: { 
  market?: Market; 
  onSuccess: () => void;
}) {
  const createMutation = useCreateMarket();
  const updateMutation = useUpdateMarket();
  const { data: organizations = [] } = useOrganizations();
  
  const form = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      name: market?.name || '',
      country: market?.country || '',
      currency: market?.currency || '',
      organization_id: market?.organization_id || '',
      is_active: market?.is_active ?? true,
    },
  });

  const onSubmit = async (data: MarketFormData) => {
    try {
      if (market) {
        await updateMutation.mutateAsync({ id: market.id, data });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter market name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input placeholder="USD" maxLength={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this market
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
            {isLoading ? (market ? 'Updating...' : 'Creating...') : (market ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function MarketManagement() {
  const [selectedMarket, setSelectedMarket] = useState<Market | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: markets = [], isLoading } = useMarkets();
  const deleteMutation = useDeleteMarket();

  const columns: ColumnDef<Market>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'country',
      header: 'Country',
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
    },
    {
      accessorKey: 'organizations.name',
      header: 'Organization',
      cell: ({ row }) => row.original.organizations?.name || '-',
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
        const market = row.original;
        
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
                  setSelectedMarket(market);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteConfirmDialog
                  title="Delete Market"
                  description="Are you sure you want to delete this market? This action cannot be undone and will affect all related data."
                  onConfirm={() => deleteMutation.mutate(market.id)}
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
    setSelectedMarket(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Management"
        description="Manage markets and their geographic configurations"
        actions={
          <FormDialog
            title={selectedMarket ? "Edit Market" : "Create Market"}
            trigger={
              <Button onClick={() => setSelectedMarket(undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Market
              </Button>
            }
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          >
            <MarketForm 
              market={selectedMarket}
              onSuccess={handleFormSuccess}
            />
          </FormDialog>
        }
      />
      
      <DataTable
        columns={columns}
        data={markets}
        searchKey="name"
        searchPlaceholder="Search markets..."
        isLoading={isLoading}
      />
    </div>
  );
}
