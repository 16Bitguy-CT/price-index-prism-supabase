
import React from 'react';
import { ChevronDown, Building2, MapPin, ArrowLeftRight, Home } from 'lucide-react';
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
import { useOrganizations } from '@/hooks/use-organizations';
import { useOrganizationContext } from '@/hooks/use-organization-context';

export function OrganizationSwitcher() {
  const { userProfile } = useAuth();
  const { data: organizations = [] } = useOrganizations();
  const { switchToOrganization, resetToHomeOrganization, isLoading, isSuperUser } = useOrganizationContext();

  if (!userProfile?.organizations) return null;

  const currentOrg = userProfile.organizations.name;
  const currentMarket = userProfile.markets?.name;
  const isSwitched = userProfile.organization_id !== userProfile.organizations.id; // This would need to be tracked differently in real implementation

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await switchToOrganization(orgId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleResetToHome = async () => {
    try {
      await resetToHomeOrganization();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{currentOrg}</p>
                {isSwitched && (
                  <ArrowLeftRight className="h-3 w-3 text-orange-500" />
                )}
              </div>
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
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Organization Context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isSuperUser ? (
          <>
            {isSwitched && (
              <>
                <DropdownMenuItem onClick={handleResetToHome} disabled={isLoading}>
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home Organization
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuLabel className="text-xs">Switch to Organization</DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => handleSwitchOrganization(org.id)}
                disabled={isLoading || org.id === userProfile.organizations?.id}
                className={org.id === userProfile.organizations?.id ? "bg-muted" : ""}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <div>
                  <p className="font-medium">{org.name}</p>
                  {org.brand_name && (
                    <p className="text-xs text-muted-foreground">{org.brand_name}</p>
                  )}
                </div>
                {org.id === userProfile.organizations?.id && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
