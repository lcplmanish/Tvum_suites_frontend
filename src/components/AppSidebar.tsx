import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { canAccess } from '@/lib/permissions';
import type { AppRole, Feature } from '@/lib/permissions';
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
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  CalendarPlus,
  LayoutDashboard,
  BedDouble,
  Package,
  Users,
  LogOut,
  Hotel,
  Contact,
  Shirt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'New Booking', url: '/', icon: CalendarPlus, feature: 'create_booking' as Feature },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, feature: 'view_dashboard' as Feature },
  { title: 'Guest Info', url: '/guests', icon: Contact, feature: 'view_guests' as Feature },
  { title: 'Rooms', url: '/rooms', icon: BedDouble, feature: 'view_rooms' as Feature },
  { title: 'Inventory', url: '/inventory', icon: Package, feature: 'view_inventory' as Feature },
  { title: 'Laundry', url: '/laundry', icon: Shirt, feature: 'view_laundry' as Feature },
  { title: 'Staff', url: '/staff', icon: Users, feature: 'view_staff' as Feature },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { logout, userRole } = useApp();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full warm-gradient flex items-center justify-center flex-shrink-0">
            <Hotel className="w-5 h-5" style={{ color: 'hsl(36, 33%, 97%)' }} />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-serif text-lg text-sidebar-foreground">Tvum Suites</h2>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.filter(item => canAccess(userRole, item.feature)).map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <RouterNavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {!collapsed && 'Sign Out'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
