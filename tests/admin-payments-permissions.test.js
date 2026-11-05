import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import { createServer } from 'vite';

let vite;
let canAccessAdminPaymentsSection;
let canExecuteAdminEscrowRelease;
let getAdminPlatformFeeUpdatePayload;

before(async () => {
  vite = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({
    canAccessAdminPaymentsSection,
    canExecuteAdminEscrowRelease,
    getAdminPlatformFeeUpdatePayload,
  } = await vite.ssrLoadModule('/src/pages/admin/adminPaymentsPermissions.ts'));
});

after(async () => {
  await vite?.close();
});

const staff = (permissions) => ({
  status: 'ready',
  data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions },
});

const superAdmin = {
  status: 'ready',
  data: { tier: 'SUPER_ADMIN', isSuperAdmin: true, permissions: [] },
};

test('Super Admin can access every supported Payments section and action', () => {
  const sections = ['financialSummary', 'platformFees', 'managePlatformFees', 'conversionOperations', 'paymentHistory', 'releaseCandidates', 'releaseExecution'];
  for (const section of sections) assert.equal(canAccessAdminPaymentsSection(superAdmin, section), true, section);
  assert.equal(canExecuteAdminEscrowRelease(superAdmin), true);
});

test('payment-only staff can see payment history without unrelated financial sections', () => {
  const permissions = staff(['finance.payments.view']);
  assert.equal(canAccessAdminPaymentsSection(permissions, 'paymentHistory'), true);
  for (const section of ['financialSummary', 'platformFees', 'conversionOperations', 'releaseCandidates', 'releaseExecution']) {
    assert.equal(canAccessAdminPaymentsSection(permissions, section), false, section);
  }
});

test('release candidate access requires both backend view permissions', () => {
  assert.equal(canAccessAdminPaymentsSection(staff(['contracts.view']), 'releaseCandidates'), false);
  assert.equal(canAccessAdminPaymentsSection(staff(['finance.contractFunding.view']), 'releaseCandidates'), false);
  const grants = staff(['contracts.view', 'finance.contractFunding.view']);
  assert.equal(canAccessAdminPaymentsSection(grants, 'releaseCandidates'), true);
  assert.equal(canExecuteAdminEscrowRelease(grants), false);
});

test('fee viewing and management are separately permissioned', () => {
  assert.equal(canAccessAdminPaymentsSection(staff(['fees.view']), 'platformFees'), true);
  assert.equal(canAccessAdminPaymentsSection(staff(['fees.view']), 'managePlatformFees'), false);
  assert.equal(canAccessAdminPaymentsSection(staff(['fees.manage']), 'managePlatformFees'), true);
  assert.equal(canAccessAdminPaymentsSection(staff(['fees.manage']), 'platformFees'), false);
  assert.equal(canAccessAdminPaymentsSection(staff(['fees.view', 'fees.manage']), 'managePlatformFees'), true);
  assert.equal(canAccessAdminPaymentsSection(staff([]), 'platformFees'), false);
  assert.equal(canAccessAdminPaymentsSection(staff([]), 'managePlatformFees'), false);
});

test('fee update payload preserves the distinct view and manage permissions', () => {
  const values = { percentage: '7.5', withdrawalPercentage: '1' };
  assert.deepEqual(getAdminPlatformFeeUpdatePayload(superAdmin, values), values);
  assert.deepEqual(getAdminPlatformFeeUpdatePayload(staff(['fees.view', 'fees.manage']), values), values);
  assert.equal(getAdminPlatformFeeUpdatePayload(staff(['fees.view']), values), null);
  assert.deepEqual(getAdminPlatformFeeUpdatePayload(staff(['fees.manage']), values), values);
  assert.deepEqual(getAdminPlatformFeeUpdatePayload(staff(['fees.manage']), { percentage: '8', withdrawalPercentage: '' }), { percentage: '8' });
  assert.equal(getAdminPlatformFeeUpdatePayload(staff(['fees.manage']), { percentage: '', withdrawalPercentage: '' }), null);
  assert.equal(getAdminPlatformFeeUpdatePayload(staff([]), values), null);
  assert.equal(getAdminPlatformFeeUpdatePayload({ status: 'loading' }, values), null);
  assert.equal(getAdminPlatformFeeUpdatePayload(undefined, values), null);
});

test('financial summary requires every backend analytics permission', () => {
  const required = ['analytics.view', 'finance.payments.view', 'finance.contractFunding.view', 'fees.view'];
  for (const missing of required) {
    assert.equal(
      canAccessAdminPaymentsSection(staff(required.filter((permission) => permission !== missing)), 'financialSummary'),
      false,
      `missing ${missing}`,
    );
  }
  assert.equal(canAccessAdminPaymentsSection(staff(required), 'financialSummary'), true);
});

test('conversion history requires its exact view permission', () => {
  assert.equal(canAccessAdminPaymentsSection(staff(['finance.payments.view']), 'conversionOperations'), false);
  assert.equal(canAccessAdminPaymentsSection(staff(['finance.conversions.view']), 'conversionOperations'), true);
});

test('loading, malformed, unknown, and empty permission data fail closed', () => {
  assert.equal(canAccessAdminPaymentsSection({ status: 'loading' }, 'paymentHistory'), false);
  assert.equal(canAccessAdminPaymentsSection(staff([]), 'paymentHistory'), false);
  assert.equal(canAccessAdminPaymentsSection(staff(['unknown.permission']), 'paymentHistory'), false);
  assert.equal(canAccessAdminPaymentsSection({
    status: 'ready',
    data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions: 'finance.payments.view' },
  }, 'paymentHistory'), false);
  assert.equal(canExecuteAdminEscrowRelease(undefined), false);
});

test('page sections and escrow actions use the shared permission decisions', async () => {
  const source = await readFile(new URL('../src/pages/admin/AdminPaymentsPage.tsx', import.meta.url), 'utf8');
  for (const section of ['FinancialSummary', 'Fees', 'ConversionOperations', 'Payments', 'ReleaseCandidates']) {
    assert.match(source, new RegExp(`\\{canView${section} \\?`), section);
  }
  assert.match(source, /if \(!canViewFinancialSummary\)[\s\S]*?getAdminAnalytics/);
  assert.match(source, /if \(!canViewFees\)[\s\S]*?getAdminPlatformFee/);
  assert.match(source, /\{canViewFees \|\| canManageFees \? <section/);
  assert.match(source, /const hasAccessibleSection =[\s\S]*?canManageFees/);
  assert.match(source, /if \(!canViewFees\) \{[\s\S]*?return undefined;[\s\S]*?getAdminPlatformFee/);
  assert.match(source, /canViewFees && !feeSettingsLoading && feeSettingsError/);
  assert.match(source, /canViewFees && feeSettings\.percentage && !canManageFees/);
  assert.match(source, /!canViewFees \|\| Boolean\(feeSettings\.percentage\)/);
  assert.match(source, /if \(!canViewConversionOperations\)[\s\S]*?getAdminConversionOperations/);
  assert.match(source, /if \(!canViewPayments\)[\s\S]*?getAdminPayments/);
  assert.match(source, /if \(!canViewReleaseCandidates\)[\s\S]*?getAdminReleaseCandidates/);
  assert.match(source, /if \(!canExecuteEscrowRelease \|\| !token \|\| loadingId/);
  assert.match(source, /\{canExecuteEscrowRelease \? isConfirming \?/);
  assert.match(source, /if \(!canManageFees \|\| !token \|\| feeSettingsSaving\) return/);
  assert.match(source, /updateAdminPlatformFee\(payload, token\)/);
  assert.match(source, /canViewFees \? 'These percentages/);
  assert.match(source, /Leave a field blank to keep its current setting unchanged/);
  assert.match(source, /if \(canViewFees\)[\s\S]*?result\.data\.data\.configuration/);
  assert.match(source, /setFeeSettings\(\{ percentage: '', withdrawalPercentage: '' \}\)/);
  assert.match(source, /required=\{canViewFees\}/);
});
