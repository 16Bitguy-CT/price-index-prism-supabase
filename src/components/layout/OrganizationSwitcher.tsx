
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
import { toast } from '@/hooks/use-toast';

export function OrganizationSwitcher() {
  const { userProfile, organizationContext } = useAuth();
  const { data: organizations = [] } = useOrganizations();

  if (!userProfile?.organizations || userProfile.role !== 'super_user') return null;

  const currentOrg = userProfile.organizations.name;
  const currentMarket = userProfile.markets?.name;
  const isSwitched = organizationContext?.isContextSwitched || false;
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSwitchOrganization = async (orgId: string, orgName: string) => {
    if (!organizationContext) return;
    
    try {
      setIsLoading(true);
      await organizationContext.switchToOrganization(orgId, orgName);
      toast({
        title: "Organization Context Switched",
        description: `You are now viewing data for ${orgName}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization context.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToHome = async () => {
    if (!organizationContext) return;
    
    try {
      setIsLoading(true);
      await organizationContext.resetToHomeOrganization();
      toast({
        title: "Returned to Home Organization",
        description: "You are now viewing your home organization's data.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset organization context.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the currently displayed organization name
  const getCurrentDisplayName = () => {
    if (isSwitched && organizationContext) {
      const switchedOrg = organizations.find(org => org.id === organizationContext.currentOrgId);
      return switchedOrg?.name || 'Unknown Organization';
    }
    return currentOrg;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{getCurrentDisplayName()}</p>
                {isSwitched && (
                  <ArrowLeftRight className="h-3 w-3 text-orange-500" />
                )}
              </div>
              {currentMarket && !isSwitched && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentMarket}
                </p>
              )}
              {isSwitched && (
                <p className="text-xs text-orange-500">Switched Context</p>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Organization Context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
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
        {organizations.map((org) => {
          const isCurrentContext = org.id === organizationContext?.currentOrgId;
          const isHomeOrg = org.id === userProfile.organization_id;
          
          return (
            <DropdownMenuItem 
              key={org.id}
              onClick={() => handleSwitchOrganization(org.id, org.name)}
              disabled={isLoading || isCurrentContext}
              className={isCurrentContext ? "bg-muted" : ""}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <div>
                <p className="font-medium">{org.name}</p>
                {org.brand_name && (
                  <p className="text-xs text-muted-foreground">{org.brand_name}</p>
                )}
              </div>
              {isCurrentContext && (
                <span className="ml-auto text-xs text-muted-foreground">Current</span>
              )}
              {isHomeOrg && !isCurrentContext && (
                <span className="ml-auto text-xs text-blue-500">Home</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
