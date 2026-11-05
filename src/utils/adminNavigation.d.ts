export type AdminTier = 'SUPER_ADMIN' | 'STAFF_ADMIN';

export type CurrentAdminPermissions = {
  tier: AdminTier;
  isSuperAdmin: boolean;
  permissions: string[];
};

export type AdminPermissionState =
  | { status: 'loading' }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CurrentAdminPermissions };

export type AdminNavigationItem = {
  section: string;
  label: string;
  to: string;
  icon: string;
  permissions?: string[];
  superAdminOnly?: boolean;
};

export const ADMIN_NAVIGATION_ITEMS: readonly AdminNavigationItem[];
export const ADMIN_HEADER_LINK_PATHS: readonly string[];
export const ADMIN_MOBILE_LINK_PATHS: readonly string[];
export const ADMIN_ACCOUNT_LINK_PATHS: readonly string[];

export function parseCurrentAdminPermissionsResponse(payload: unknown): CurrentAdminPermissions | null;
export function hasAdminNavigationAccess(permissionState: AdminPermissionState, item: AdminNavigationItem | { permissions: string[] }): boolean;
export function getVisibleAdminNavigationItems(permissionState: AdminPermissionState, paths?: readonly string[] | null): AdminNavigationItem[];
export function getVisibleAdminNavigationSections(permissionState: AdminPermissionState): Array<{ heading: string; items: AdminNavigationItem[] }>;
export function isAdminRouteAllowed(pathname: string, permissionState: AdminPermissionState): boolean;
