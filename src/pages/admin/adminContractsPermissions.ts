import { hasAdminNavigationAccess, type AdminPermissionState } from '../../utils/adminNavigation.js';
import type { AdminContractListItem } from '../../services/api';

export type AdminContractManagementAction = 'cancel' | 'archive';

const permissionRequirements = {
  view: ['contracts.view', 'finance.contractFunding.view'],
  cancel: ['contracts.cancel'],
  archive: ['contracts.archive'],
} as const;

export function canAccessAdminContracts(
  permissionState: AdminPermissionState | undefined,
  action: 'view' | AdminContractManagementAction,
) {
  return permissionState
    ? hasAdminNavigationAccess(permissionState, { permissions: [...permissionRequirements[action]] })
    : false;
}

export function canExecuteAdminContractOperation(
  permissionState: AdminPermissionState | undefined,
  permission: string,
) {
  return permissionState
    ? hasAdminNavigationAccess(permissionState, { permissions: [permission] })
    : false;
}

export function canShowAdminContractAction(
  permissionState: AdminPermissionState | undefined,
  contract: Pick<AdminContractListItem, 'employerArchivedAt' | 'availableActions'>,
  action: AdminContractManagementAction,
) {
  if (!canAccessAdminContracts(permissionState, action) || contract.availableActions?.[action] !== true) return false;
  return action !== 'archive' || !contract.employerArchivedAt;
}
