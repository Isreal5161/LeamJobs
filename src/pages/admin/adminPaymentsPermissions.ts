import { hasAdminNavigationAccess, type AdminPermissionState } from '../../utils/adminNavigation.js';

export const ADMIN_PAYMENTS_PERMISSION_REQUIREMENTS = {
  financialSummary: ['analytics.view', 'finance.payments.view', 'finance.contractFunding.view', 'fees.view'],
  platformFees: ['fees.view'],
  managePlatformFees: ['fees.manage'],
  conversionOperations: ['finance.conversions.view'],
  paymentHistory: ['finance.payments.view'],
  releaseCandidates: ['contracts.view', 'finance.contractFunding.view'],
  releaseExecution: ['finance.escrowRelease.execute'],
};

export type AdminPaymentsSection = keyof typeof ADMIN_PAYMENTS_PERMISSION_REQUIREMENTS;
export type AdminPlatformFeeValues = { percentage: string; withdrawalPercentage: string };
export type AdminPlatformFeeUpdate = { percentage?: string; withdrawalPercentage?: string };

export function canAccessAdminPaymentsSection(
  permissionState: AdminPermissionState | undefined,
  section: AdminPaymentsSection,
) {
  return permissionState
    ? hasAdminNavigationAccess(permissionState, { permissions: ADMIN_PAYMENTS_PERMISSION_REQUIREMENTS[section] })
    : false;
}

export function canExecuteAdminEscrowRelease(permissionState: AdminPermissionState | undefined) {
  return canAccessAdminPaymentsSection(permissionState, 'releaseCandidates')
    && canAccessAdminPaymentsSection(permissionState, 'releaseExecution');
}

export function getAdminPlatformFeeUpdatePayload(
  permissionState: AdminPermissionState | undefined,
  values: AdminPlatformFeeValues,
): AdminPlatformFeeUpdate | null {
  if (!canAccessAdminPaymentsSection(permissionState, 'managePlatformFees')) return null;

  const percentage = values.percentage.trim();
  const withdrawalPercentage = values.withdrawalPercentage.trim();
  if (canAccessAdminPaymentsSection(permissionState, 'platformFees')) {
    return { percentage, withdrawalPercentage };
  }

  const payload: AdminPlatformFeeUpdate = {};
  if (percentage) payload.percentage = percentage;
  if (withdrawalPercentage) payload.withdrawalPercentage = withdrawalPercentage;
  return Object.keys(payload).length > 0 ? payload : null;
}
