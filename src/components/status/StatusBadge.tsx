
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}

export function StatusBadge({ 
  isActive, 
  activeText = "Active", 
  inactiveText = "Inactive",
  className 
}: StatusBadgeProps) {
  return (
    <Badge 
      variant={isActive ? "default" : "secondary"}
      className={cn(
        isActive 
          ? "bg-green-100 text-green-800 hover:bg-green-100" 
          : "bg-gray-100 text-gray-800 hover:bg-gray-100",
        className
      )}
    >
      {isActive ? activeText : inactiveText}
    </Badge>
  );
}
