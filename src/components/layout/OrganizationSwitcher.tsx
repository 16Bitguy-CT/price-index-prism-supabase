
import React from 'react';
import { ChevronDown, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export function OrganizationSwitcher() {
  const { userProfile } = useAuth();

  if (!userProfile?.organizations) return null;

  // For now, this is static. In the future, this will be dynamic with multiple organizations/markets
  const currentOrg = userProfile.organizations.name;
  const currentMarket = userProfile.markets?.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <div className="text-left">
              <p className="text-sm font-medium">{currentOrg}</p>
              {currentMarket && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentMarket}
                </p>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Current Context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Building2 className="h-4 w-4 mr-2" />
          {currentOrg}
        </DropdownMenuItem>
        {currentMarket && (
          <DropdownMenuItem disabled>
            <MapPin className="h-4 w-4 mr-2" />
            {currentMarket}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          Switch functionality coming soon
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
