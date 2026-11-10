import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import { createServer } from 'vite';
import {
  ADMIN_NAVIGATION_ITEMS,
  ADMIN_MOBILE_LINK_PATHS,
  getVisibleAdminNavigationItems,
  isAdminRouteAllowed,
} from '../src/utils/adminNavigation.js';

let vite;
let canAccessAdminContracts;
let canExecuteAdminContractOperation;
let canShowAdminContractAction;

before(async () => {
  vite = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({ canAccessAdminContracts, canExecuteAdminContractOperation, canShowAdminContractAction } = await vite.ssrLoadModule(
    '/src/pages/admin/adminContractsPermissions.ts',
  ));
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

test('Contracts navigation and list route require both contract and financial view grants', () => {
  const contractsItem = ADMIN_NAVIGATION_ITEMS.find(({ to }) => to === '/admin/contracts');
  assert.deepEqual(contractsItem.permissions, ['contracts.view', 'finance.contractFunding.view']);
  assert.ok(ADMIN_MOBILE_LINK_PATHS.includes('/admin/contracts'));
  assert.equal(isAdminRouteAllowed('/admin/contracts', staff(['contracts.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/contracts', staff(['contracts.view', 'finance.contractFunding.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/contracts/123', staff(['contracts.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/contracts/123', staff(['contracts.view', 'finance.contractFunding.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/contracts', superAdmin), true);
});

test('Staff action controls require their exact permission and a backend eligibility flag', () => {
  const contract = { employerArchivedAt: null, availableActions: { cancel: true, archive: true } };
  assert.equal(canAccessAdminContracts(staff(['contracts.cancel']), 'cancel'), true);
  assert.equal(canAccessAdminContracts(staff(['contracts.archive']), 'archive'), true);
  assert.equal(canAccessAdminContracts(staff(['contracts.view']), 'cancel'), false);
  assert.equal(canShowAdminContractAction(staff(['contracts.cancel']), contract, 'cancel'), true);
  assert.equal(canShowAdminContractAction(staff(['contracts.archive']), contract, 'archive'), true);
  assert.equal(canShowAdminContractAction(staff(['contracts.cancel']), { ...contract, availableActions: { cancel: false } }, 'cancel'), false);
  assert.equal(canShowAdminContractAction(staff(['contracts.archive']), { ...contract, employerArchivedAt: '2026-10-01' }, 'archive'), false);
  assert.equal(canShowAdminContractAction({ status: 'loading' }, contract, 'archive'), false);
  assert.equal(canShowAdminContractAction(superAdmin, contract, 'cancel'), true);
});

test('Admin-created unfunded contracts show Cancel when the backend allows it, without payment details', () => {
  const contract = {
    employerArchivedAt: null,
    funding: { paymentStatus: null },
    availableActions: { cancel: true },
  };
  assert.equal(canShowAdminContractAction(staff(['contracts.cancel']), contract, 'cancel'), true);
  assert.equal(canShowAdminContractAction(superAdmin, contract, 'cancel'), true);
});

test('ordinary employer contracts remain non-cancellable through Admin actions', () => {
  const contract = {
    employerArchivedAt: null,
    funding: { paymentStatus: null },
    availableActions: { cancel: false },
  };
  assert.equal(canShowAdminContractAction(staff(['contracts.cancel']), contract, 'cancel'), false);
  assert.equal(canShowAdminContractAction(superAdmin, contract, 'cancel'), false);
});

test('Completed contracts expose Archive only when the backend marks it available', () => {
  const completed = {
    employerArchivedAt: null,
    status: 'COMPLETED',
    availableActions: { archive: true },
  };
  assert.equal(canShowAdminContractAction(staff(['contracts.archive']), completed, 'archive'), true);
  assert.equal(canShowAdminContractAction(staff(['contracts.archive']), {
    ...completed,
    availableActions: { archive: false },
  }, 'archive'), false);
});

test('Admin contract funding and completion controls require their specific grants', () => {
  assert.equal(canExecuteAdminContractOperation(staff(['finance.contractFunding.execute']), 'finance.contractFunding.execute'), true);
  assert.equal(canExecuteAdminContractOperation(staff(['contracts.complete']), 'contracts.complete'), true);
  assert.equal(canExecuteAdminContractOperation(staff(['contracts.view']), 'finance.contractFunding.execute'), false);
  assert.equal(canExecuteAdminContractOperation(staff(['contracts.view']), 'contracts.complete'), false);
  assert.equal(canExecuteAdminContractOperation(superAdmin, 'finance.contractFunding.execute'), true);
});

test('Shared Admin contract detail gates financial and completion operations by permission', async () => {
  const page = await readFile(new URL('../src/pages/contracts/ContractPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /role === 'ADMIN'\s*&& canExecuteAdminContractOperation\(adminPermissionState, 'finance\.contractFunding\.execute'\)/);
  assert.match(page, /role === 'ADMIN'\s*&& canExecuteAdminContractOperation\(adminPermissionState, 'contracts\.complete'\)/);
  assert.match(page, /\(role !== 'ADMIN' \|\| canAdminFund\) && canShowContractFundingAction/);
  assert.match(page, /role === 'ADMIN' && canAdminConfirmCompletion && isFunded/);
});

test('Admin Contracts page wires search, independent status filters, pagination, and refresh', async () => {
  const page = await readFile(new URL('../src/pages/admin/AdminContractsPage.tsx', import.meta.url), 'utf8');
  const api = await readFile(new URL('../src/services/api.ts', import.meta.url), 'utf8');
  for (const filter of ['status', 'escrowStatus', 'workStatus']) {
    assert.match(page, new RegExp(`value=\\{${filter}\\}`), `${filter} filter`);
    assert.match(api, new RegExp(`query\\.set\\('${filter}'`), `${filter} API parameter`);
  }
  assert.match(page, /placeholder="Contract ID, job, employer, or seeker"/);
  assert.match(api, /query\.set\('search', options\.search\.trim\(\)\)/);
  assert.match(page, /Previous/);
  assert.match(page, /Next/);
  assert.match(page, /setReloadKey\(\(value\) => value \+ 1\)/);
  assert.match(page, /employerArchivedAt \? <span[^>]*>Archived/);
});

test('Cancel and archive use distinct confirmation warnings and refresh after success', async () => {
  const page = await readFile(new URL('../src/pages/admin/AdminContractsPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /Cancel this unfunded contract\?/);
  assert.match(page, /reject the selected application/);
  assert.match(page, /No refund, wallet credit, or escrow release/);
  assert.match(page, /Archive this contract\?/);
  assert.match(page, /remains visible in Admin and is not permanently deleted/);
  assert.match(page, /payments, refunds, payouts, webhook events, ledger entries, and audit history are retained/);
  assert.match(page, /Archive is unavailable until completion and full financial settlement are verified/);
  assert.match(page, /role="alertdialog"/);
  assert.match(page, /setSelectedAction\(null\)[\s\S]*?setNotice\(action === 'cancel'/);
  assert.match(page, /setReloadKey\(\(value\) => value \+ 1\)/);
  assert.match(page, /canShowAdminContractAction\(permissionState, contract, 'cancel'\)/);
});
