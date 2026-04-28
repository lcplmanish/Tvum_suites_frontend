export type AppRole = 'owner' | 'admin' | 'supervisor' | 'accountant' | 'staff';

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

const permissions: Record<Feature, AppRole[]> = {
  view_dashboard:  ['owner', 'admin', 'accountant'],
  view_bookings:   ['owner', 'admin'],
  create_booking:  ['owner', 'admin', 'supervisor'],
  edit_booking:    ['owner', 'admin'],
  delete_booking:  ['owner', 'admin'],
  view_food:       ['owner', 'admin', 'supervisor', 'accountant', 'staff'],
  edit_food_prices:['owner', 'admin'],
  view_guests:     ['owner', 'admin'],
  edit_guest:      ['owner', 'admin'],
  view_rooms:      ['owner', 'admin', 'supervisor'],
  edit_rooms:      ['owner', 'admin'],
  view_inventory:  ['owner', 'admin', 'supervisor', 'staff'],
  edit_inventory:  ['owner', 'admin', 'supervisor'],
  view_staff:      ['owner', 'admin', 'supervisor', 'staff'],
  view_laundry:    ['owner', 'admin', 'supervisor', 'staff'],
  manage_staff:    ['owner', 'admin', 'supervisor'],
  delete_staff:    ['owner', 'admin'],
  manage_roles:    ['owner', 'admin'],
};

const pageAccess: Record<PageRoute, AppRole[]> = {
  '/': ['owner', 'admin', 'supervisor'],
  '/dashboard': ['owner', 'admin', 'accountant'],
  '/food': ['owner', 'admin', 'supervisor', 'accountant', 'staff'],
  '/guests': ['owner', 'admin'],
  '/rooms': ['owner', 'admin', 'supervisor'],
  '/inventory': ['owner', 'admin', 'supervisor', 'staff'],
  '/staff': ['owner', 'admin', 'supervisor', 'staff'],
  '/laundry': ['owner', 'admin', 'supervisor', 'staff'],
  '/ai': ['owner', 'admin', 'supervisor', 'accountant', 'staff'],
};

export function canAccess(role: AppRole, feature: Feature): boolean {
  return permissions[feature]?.includes(role) ?? false;
}

export function canAccessPage(role: AppRole, page: PageRoute): boolean {
  return pageAccess[page]?.includes(role) ?? false;
}
