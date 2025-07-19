
import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenu } from './UserMenu';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useAuth } from '@/contexts/AuthContext';

export function AppHeader() {
  const { userProfile } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">PI</span>
              </div>
              <span className="font-semibold">Price Index</span>
            </Link>
            
            {userProfile?.organizations && <OrganizationSwitcher />}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
