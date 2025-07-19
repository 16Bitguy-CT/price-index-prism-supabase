
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  MapPin, 
  Radio, 
  Tags, 
  Store, 
  Users, 
  User,
  UserCheck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationItem } from '@/types/navigation';

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    roles: ['super_user', 'power_user', 'market_admin', 'representative'],
  },
  {
    title: 'Organization Management',
    url: '/organizations',
    icon: Building2,
    roles: ['super_user'],
  },
  {
    title: 'Market Management',
    url: '/markets',
    icon: MapPin,
    roles: ['super_user', 'power_user'],
  },
  {
    title: 'Channel Management',
    url: '/channels',
    icon: Radio,
    roles: ['super_user', 'power_user', 'market_admin'],
  },
  {
    title: 'Segment Management',
    url: '/segments',
    icon: Tags,
    roles: ['super_user', 'power_user', 'market_admin'],
  },
  {
    title: 'Outlet Management',
    url: '/outlets',
    icon: Store,
    roles: ['super_user', 'power_user', 'market_admin'],
  },
  {
    title: 'User Management',
    url: '/users',
    icon: Users,
    roles: ['super_user', 'power_user', 'market_admin'],
  },
  {
    title: 'User Approval',
    url: '/user-approval',
    icon: UserCheck,
    roles: ['super_user', 'power_user', 'market_admin'],
  },
];

export function AppSidebar() {
  const { userProfile } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();

  const hasAccess = (roles: string[]) => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  const filteredNavigation = navigationItems.filter(item => hasAccess(item.roles));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">PI</span>
          </div>
          {state === 'expanded' && (
            <div>
              <h2 className="text-sm font-semibold">Price Index</h2>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={state === 'collapsed' ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/profile'}
                  tooltip={state === 'collapsed' ? 'Profile' : undefined}
                >
                  <NavLink to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
