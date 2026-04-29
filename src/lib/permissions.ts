export type AppRole = 'owner' | 'admin' | 'main_supervisor' | 'supervisor' | 'accountant' | 'staff';

export type Feature =
  | 'view_dashboard'
  | 'view_bookings'
  | 'create_booking'
  | 'edit_booking'
  | 'delete_booking'
  | 'view_food'
  | 'edit_food_prices'
  | 'view_guests'
  | 'edit_guest'
  | 'view_rooms'
  | 'edit_rooms'
  | 'view_inventory'
  | 'edit_inventory'
  | 'view_staff'
  | 'view_laundry'
  | 'manage_staff'
  | 'delete_staff'
  | 'manage_roles';

export type PageRoute = '/' | '/dashboard' | '/food' | '/guests' | '/rooms' | '/inventory' | '/staff' | '/laundry' | '/ai';

const fullAccessRoles: AppRole[] = ['owner', 'admin', 'main_supervisor'];

export const roleLabels: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  main_supervisor: 'Main Supervisor',
  supervisor: 'Supervisor',
  accountant: 'Accountant',
  staff: 'Staff',
};

export function getRoleLabel(role: AppRole): string {
  return roleLabels[role];
}

const permissions: Record<Feature, AppRole[]> = {
  view_dashboard:  [...fullAccessRoles, 'accountant'],
  view_bookings:   [...fullAccessRoles],
  create_booking:  [...fullAccessRoles, 'supervisor'],
  edit_booking:    [...fullAccessRoles],
  delete_booking:  [...fullAccessRoles],
  view_food:       [...fullAccessRoles, 'supervisor', 'accountant', 'staff'],
  edit_food_prices:[...fullAccessRoles],
  view_guests:     [...fullAccessRoles],
  edit_guest:      [...fullAccessRoles],
  view_rooms:      [...fullAccessRoles, 'supervisor'],
  edit_rooms:      [...fullAccessRoles],
  view_inventory:  [...fullAccessRoles, 'supervisor', 'staff'],
  edit_inventory:  [...fullAccessRoles, 'supervisor'],
  view_staff:      [...fullAccessRoles, 'supervisor', 'staff'],
  view_laundry:    [...fullAccessRoles, 'supervisor', 'staff'],
  manage_staff:    [...fullAccessRoles, 'supervisor'],
  delete_staff:    [...fullAccessRoles],
  manage_roles:    [...fullAccessRoles],
};

const pageAccess: Record<PageRoute, AppRole[]> = {
  '/': [...fullAccessRoles, 'supervisor'],
  '/dashboard': [...fullAccessRoles, 'accountant'],
  '/food': [...fullAccessRoles, 'supervisor', 'accountant', 'staff'],
  '/guests': [...fullAccessRoles],
  '/rooms': [...fullAccessRoles, 'supervisor'],
  '/inventory': [...fullAccessRoles, 'supervisor', 'staff'],
  '/staff': [...fullAccessRoles, 'supervisor', 'staff'],
  '/laundry': [...fullAccessRoles, 'supervisor', 'staff'],
  '/ai': [...fullAccessRoles, 'supervisor', 'accountant', 'staff'],
};

export function canAccess(role: AppRole, feature: Feature): boolean {
  return permissions[feature]?.includes(role) ?? false;
}

export function canAccessPage(role: AppRole, page: PageRoute): boolean {
  return pageAccess[page]?.includes(role) ?? false;
}
