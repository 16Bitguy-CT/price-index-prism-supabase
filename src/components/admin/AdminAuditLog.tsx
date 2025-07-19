
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminAuditLog, AuditLogEntry } from '@/hooks/use-admin-audit';
import { format } from 'date-fns';
import { Shield, User, Users, RotateCcw, UserPlus, UserX } from 'lucide-react';

const actionIcons = {
  create_user: UserPlus,
  update_user: User,
  activate_user: RotateCcw,
  deactivate_user: UserX,
  change_role: Shield,
  delete_user: UserX,
  bulk_operation: Users,
};

const actionColors = {
  create_user: 'bg-green-100 text-green-800',
  update_user: 'bg-blue-100 text-blue-800',
  activate_user: 'bg-green-100 text-green-800',
  deactivate_user: 'bg-red-100 text-red-800',
  change_role: 'bg-purple-100 text-purple-800',
  delete_user: 'bg-red-100 text-red-800',
  bulk_operation: 'bg-orange-100 text-orange-800',
};

function AuditLogItem({ entry }: { entry: AuditLogEntry }) {
  const IconComponent = actionIcons[entry.action];
  const colorClass = actionColors[entry.action];

  const formatActionDescription = () => {
    switch (entry.action) {
      case 'create_user':
        return `Created user with role ${entry.details.role}`;
      case 'activate_user':
        return 'Activated user account';
      case 'deactivate_user':
        return 'Deactivated user account';
      case 'change_role':
        return `Changed role from ${entry.details.old_role} to ${entry.details.new_role}`;
      case 'bulk_operation':
        return `Bulk ${entry.details.operation} on ${entry.details.user_count} users`;
      default:
        return entry.action.replace('_', ' ');
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 border-b border-gray-100 last:border-b-0">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {entry.admin_profiles?.first_name} {entry.admin_profiles?.last_name}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        
        <p className="text-sm text-gray-600">{formatActionDescription()}</p>
        
        {entry.target_profiles && (
          <p className="text-xs text-gray-500">
            Target: {entry.target_profiles.first_name} {entry.target_profiles.last_name}
          </p>
        )}
        
        {entry.reason && (
          <p className="text-xs text-gray-500 italic mt-1">
            Reason: {entry.reason}
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminAuditLog() {
  const { data: auditLog = [], isLoading } = useAdminAuditLog();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity Log</CardTitle>
          <CardDescription>Loading audit trail...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Activity Log</CardTitle>
        <CardDescription>
          Recent administrative actions performed by system administrators
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {auditLog.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No administrative actions recorded yet.
          </div>
        ) : (
          <ScrollArea className="h-96">
            {auditLog.map((entry) => (
              <AuditLogItem key={entry.id} entry={entry} />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
