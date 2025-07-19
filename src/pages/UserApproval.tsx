import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Check, X, Clock, User } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

interface PendingUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  approval_status: string;
  created_at: string;
  organization_id: string;
  role: string;
}

export default function UserApproval() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  // Fetch pending users
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PendingUser[];
    },
  });

  // Approve/reject user mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: 'approve' | 'reject'; reason?: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!adminProfile) throw new Error('Admin profile not found');

      const updateData: any = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        approved_by_user_id: adminProfile.id,
        approved_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.is_active = true;
      } else {
        updateData.rejection_reason = reason;
        updateData.is_active = false;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Success",
        description: `User ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${actionType} user.`,
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = (user: PendingUser, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setActionType(action);
    if (action === 'approve') {
      // Approve immediately without dialog
      approvalMutation.mutate({ userId: user.id, action: 'approve' });
    } else {
      // Show dialog for rejection reason
      setIsDialogOpen(true);
    }
  };

  const handleRejectSubmit = () => {
    if (selectedUser && rejectionReason.trim()) {
      approvalMutation.mutate({
        userId: selectedUser.id,
        action: 'reject',
        reason: rejectionReason.trim(),
      });
    }
  };

  const columns: ColumnDef<PendingUser>[] = [
    {
      accessorKey: 'first_name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Requested',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.created_at), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'approval_status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleApprovalAction(row.original, 'approve')}
            disabled={approvalMutation.isPending}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleApprovalAction(row.original, 'reject')}
            disabled={approvalMutation.isPending}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const pendingCount = pendingUsers?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Approval"
        description="Review and approve pending user registrations"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Users waiting for approval
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingCount > 0 ? (
        <DataTable
          columns={columns}
          data={pendingUsers || []}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Pending Approvals</CardTitle>
            <CardDescription>
              All user registrations have been processed.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Rejection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedUser?.first_name} {selectedUser?.last_name}'s registration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this registration is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || approvalMutation.isPending}
            >
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}