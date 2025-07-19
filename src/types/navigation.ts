
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: ('super_user' | 'power_user' | 'market_admin' | 'representative')[];
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  title: string;
  url?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}
