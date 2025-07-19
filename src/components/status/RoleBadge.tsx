
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: 'super_user' | 'power_user' | 'market_admin' | 'representative';
  className?: string;
}

const roleConfig = {
  super_user: { label: 'Super User', color: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  power_user: { label: 'Power User', color: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  market_admin: { label: 'Market Admin', color: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  representative: { label: 'Representative', color: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  
  return (
    <Badge 
      variant="secondary"
      className={cn(config.color, className)}
    >
      {config.label}
    </Badge>
  );
}
