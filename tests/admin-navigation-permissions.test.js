import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  ADMIN_ACCOUNT_LINK_PATHS,
  ADMIN_HEADER_LINK_PATHS,
  ADMIN_MOBILE_LINK_PATHS,
  ADMIN_NAVIGATION_ITEMS,
  getVisibleAdminNavigationItems,
  getVisibleAdminNavigationSections,
  hasAdminNavigationAccess,
  isAdminRouteAllowed,
  parseCurrentAdminPermissionsResponse,
} from '../src/utils/adminNavigation.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const staff = (permissions) => ({
  status: 'ready',
  data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions },
});
const superAdmin = {
  status: 'ready',
  data: { tier: 'SUPER_ADMIN', isSuperAdmin: true, permissions: [] },
};
const paths = (state, filter = null) => getVisibleAdminNavigationItems(state, filter).map(({ to }) => to);

test('Super Admin receives all supported navigation including Staff Management', () => {
  assert.deepEqual(paths(superAdmin), ADMIN_NAVIGATION_ITEMS.map(({ to }) => to));
  assert.ok(paths(superAdmin).includes('/admin/staff'));
  assert.equal(isAdminRouteAllowed('/admin/staff', superAdmin), true);
});

test('jobs.view exposes only job-view navigation and not financial or staff management', () => {
  const visible = paths(staff(['jobs.view']));
  assert.ok(visible.includes('/admin/jobs'));
  assert.ok(visible.includes('/admin/moderation'));
  assert.ok(visible.includes('/admin/filters'));
  assert.ok(!visible.includes('/admin/payments'));
  assert.ok(!visible.includes('/admin/analytics'));
  assert.ok(!visible.includes('/admin/staff'));
  assert.ok(!visible.includes('/admin/settings'));
});

test('users.view exposes user and seeker sections but not unrelated sections', () => {
  const visible = paths(staff(['users.view']));
  assert.ok(visible.includes('/admin/users'));
  assert.ok(visible.includes('/admin/seekers'));
  assert.ok(!visible.includes('/admin/companies'));
  assert.ok(!visible.includes('/admin/recommendations'));
  assert.ok(!visible.includes('/admin/payments'));
});

test('financial navigation requires its exact view permission and analytics ALL set', () => {
  assert.ok(!paths(staff(['jobs.view'])).includes('/admin/payments'));
  assert.ok(paths(staff(['finance.payments.view'])).includes('/admin/payments'));
  assert.ok(!paths(staff(['finance.payments.view'])).includes('/admin/analytics'));

  const analyticsPermissions = [
    'analytics.view',
    'finance.payments.view',
    'finance.contractFunding.view',
    'fees.view',
  ];
  assert.ok(paths(staff(analyticsPermissions)).includes('/admin/analytics'));
  assert.ok(!paths(staff(analyticsPermissions.slice(1))).includes('/admin/analytics'));
});

test('withdrawal monitoring is visible and directly accessible only with its dedicated permission', () => {
  const navItem = ADMIN_NAVIGATION_ITEMS.find(({ to }) => to === '/admin/withdrawals');
  assert.deepEqual(navItem?.permissions, ['finance.withdrawals.view']);
  assert.equal(navItem?.sidebarLabel, 'Withdrawals');
  assert.ok(paths(superAdmin).includes('/admin/withdrawals'));
  assert.ok(paths(staff(['finance.withdrawals.view'])).includes('/admin/withdrawals'));
  assert.ok(paths(staff(['finance.withdrawals.execute'])).includes('/admin/withdrawals') === false);
  assert.ok(!paths(staff(['finance.withdrawals.reconcile'])).includes('/admin/withdrawals'));
  assert.equal(isAdminRouteAllowed('/admin/withdrawals', staff(['finance.withdrawals.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/withdrawals/123', staff(['finance.withdrawals.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/withdrawals', staff(['finance.withdrawals.execute'])), false);
  assert.ok(ADMIN_MOBILE_LINK_PATHS.includes('/admin/withdrawals'));
});

test('withdrawal monitoring page uses the read-only Admin API and compact mobile navigation label', async () => {
  const [page, api, mobileNav] = await Promise.all([
    readSource('../src/pages/admin/AdminWithdrawalsPage.tsx'),
    readSource('../src/services/api.ts'),
    readSource('../src/components/layout/MobileBottomNav.tsx'),
  ]);
  assert.match(page, /getAdminWithdrawals\(token, query\)/);
  assert.match(page, /getAdminWithdrawal\(token, selectedId\)/);
  assert.match(page, /totalSuccessfullyPaid/);
  assert.match(page, /totalAwaitingProcessing/);
  assert.match(page, /aria-modal="true"/);
  assert.match(api, /endpoint: `\/admin\/withdrawals\$\{queryString/);
  assert.match(api, /endpoint: `\/admin\/withdrawals\/\$\{encodeURIComponent\(id\)\}`/);
  assert.match(mobileNav, /item\.label === 'Withdrawal Monitoring'[\s\S]*?'Withdrawals'/);
  assert.match(mobileNav, /aria-label=\{item\.label\}/);
});

test('withdrawal sidebar label, mobile spacing, brand colors, and centered details dialog are wired', async () => {
  const [sidebar, adminCss, withdrawalsCss] = await Promise.all([
    readSource('../src/components/layout/DashboardSidebar.tsx'),
    readSource('../src/styles/admin.css'),
    readSource('../src/styles/admin-withdrawals.css'),
  ]);
  assert.match(sidebar, /item\.sidebarLabel \?\? item\.label/);
  assert.match(sidebar, /aria-label=\{item\.label\}/);
  assert.match(adminCss, /\.mobile-bottom-nav--admin \{[^}]*gap:\s*0\.3rem/s);
  assert.match(adminCss, /\.mobile-bottom-nav--admin \.mobile-bottom-nav__item \{[^}]*flex:\s*0 0 auto/s);
  assert.match(adminCss, /\.mobile-bottom-nav--admin \{[^}]*overflow-x:\s*auto/s);
  assert.match(withdrawalsCss, /background:\s*var\(--brand-primary-active\)/);
  assert.match(withdrawalsCss, /\.admin-withdrawal-dialog-backdrop \{[^}]*place-items:\s*center/s);
  assert.match(withdrawalsCss, /\.admin-withdrawal-dialog \{[^}]*max-height:\s*min\(88dvh,\s*60rem\)/s);
});

test('communications and content navigation require the backend ALL-permission combinations', () => {
  assert.ok(!paths(staff(['communications.campaigns.view'])).includes('/admin/communications'));
  assert.ok(paths(staff([
    'communications.templates.view',
    'communications.campaigns.view',
  ])).includes('/admin/communications'));

  assert.ok(!paths(staff(['content.edit'])).includes('/admin/content'));
  assert.ok(paths(staff(['content.edit', 'content.publish'])).includes('/admin/content'));
});

test('unknown keys do not expose navigation and empty groups are omitted', () => {
  const visible = getVisibleAdminNavigationSections(staff(['admin.full_access', 'finance.superuser']));
  assert.deepEqual(visible, []);
  assert.equal(hasAdminNavigationAccess(staff(['admin.full_access']), { permissions: ['jobs.view'] }), false);
});

test('missing, malformed, loading, error, and forbidden permissions fail closed', () => {
  const invalidResponses = [
    null,
    {},
    { success: true, data: { tier: 'STAFF_ADMIN', isSuperAdmin: false } },
    { success: true, data: { tier: 'STAFF_ADMIN', isSuperAdmin: true, permissions: ['jobs.view'] } },
    { success: true, data: { tier: 'SUPER_ADMIN', isSuperAdmin: false, permissions: [] } },
    { success: true, data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions: [''] } },
    { success: true, data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions: [4] } },
  ];
  for (const response of invalidResponses) assert.equal(parseCurrentAdminPermissionsResponse(response), null);

  for (const state of [
    { status: 'loading' },
    { status: 'forbidden', message: 'Forbidden' },
    { status: 'error', message: 'Offline' },
  ]) {
    assert.deepEqual(paths(state), []);
    assert.equal(isAdminRouteAllowed('/admin/jobs', state), false);
  }
});

test('a valid response is normalized and unknown permission keys do not match entries', () => {
  assert.deepEqual(
    parseCurrentAdminPermissionsResponse({
      success: true,
      data: { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions: ['jobs.view', 'jobs.view', 'made.up'] },
    }),
    { tier: 'STAFF_ADMIN', isSuperAdmin: false, permissions: ['jobs.view', 'made.up'] },
  );
  assert.deepEqual(paths(staff(['made.up'])), []);
});

test('header, account menu, and mobile links use the same permission policy', () => {
  const permissions = staff(['jobs.view', 'users.view', 'notifications.view']);
  for (const filter of [ADMIN_HEADER_LINK_PATHS, ADMIN_ACCOUNT_LINK_PATHS, ADMIN_MOBILE_LINK_PATHS]) {
    const visible = paths(permissions, filter);
    assert.ok(visible.every((path) => paths(permissions).includes(path)));
    assert.ok(!visible.includes('/admin/staff'));
    assert.ok(!visible.includes('/admin/payments'));
  }
  assert.ok(paths(superAdmin, ADMIN_HEADER_LINK_PATHS).includes('/admin/staff'));
});

test('direct nested routes require their actual permission combinations', () => {
  assert.equal(isAdminRouteAllowed('/admin', staff(['jobs.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/jobs/123/applicants', staff(['applications.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/jobs/123/applicants/456', staff(['jobs.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/contracts/123', staff(['contracts.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/contracts/123', staff(['contracts.view', 'finance.contractFunding.view'])), true);
  assert.equal(isAdminRouteAllowed('/admin/payments', staff(['fees.manage'])), true);
  assert.equal(isAdminRouteAllowed('/admin/payments', staff(['fees.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/staff', staff(['users.view'])), false);
  assert.equal(isAdminRouteAllowed('/admin/settings', staff(['notifications.view'])), false);
});

test('layout keeps the admin route mounted during throttled background permission refreshes', async () => {
  const layout = await readSource('../src/layouts/AdminLayout.tsx');
  assert.match(layout, /getCurrentAdminPermissions\(token\)/);
  assert.match(layout, /adminPermissionState\.status === 'loading'[\s\S]*?Verifying admin access/);
  assert.match(layout, /adminPermissionState\.status === 'error'[\s\S]*?Retry/);
  assert.match(layout, /adminPermissionState\.status === 'forbidden'/);
  assert.match(layout, /routeAllowed \?[\s\S]*?<Outlet context={adminPermissionState} \/>/);
  assert.match(layout, /permissionRequests\.has\(currentSession\)/);
  assert.match(layout, /verifiedSession\.current === currentSession/);
  assert.match(layout, /permissionRefreshError/);
  assert.match(layout, />= 60_000/);
  assert.match(layout, /window\.addEventListener\('focus', refreshWhenVisible\)/);
  assert.match(layout, /document\.addEventListener\('visibilitychange', refreshWhenVisible\)/);
});

test('API client validates the effective-permissions envelope and uses the existing authenticated client', async () => {
  const api = await readSource('../src/services/api.ts');
  assert.match(api, /request<unknown>\(\{[\s\S]*?endpoint: '\/admin\/me\/permissions',[\s\S]*?token,/);
  assert.match(api, /parseCurrentAdminPermissionsResponse\(result\.data\)/);
  assert.match(api, /Administrator permissions could not be verified/);
});

test('sidebar active-route, collapse, tablet rail, and shared navigation data remain wired', async () => {
  const [sidebar, mobile, topbar, css] = await Promise.all([
    readSource('../src/components/layout/DashboardSidebar.tsx'),
    readSource('../src/components/layout/MobileBottomNav.tsx'),
    readSource('../src/components/layout/DashboardTopbar.tsx'),
    readSource('../src/styles/admin.css'),
  ]);
  assert.match(sidebar, /getVisibleAdminNavigationSections\(adminPermissionState\)/);
  assert.match(sidebar, /dashboard-menu__toggle/);
  assert.match(sidebar, /isActive \? 'dashboard-menu__link--active'/);
  assert.match(sidebar, /title=\{item\.label\}/);
  assert.match(mobile, /getVisibleAdminNavigationItems\(adminPermissionState, ADMIN_MOBILE_LINK_PATHS\)/);
  assert.match(topbar, /getVisibleAdminNavigationItems\(adminPermissionState[\s\S]*?ADMIN_HEADER_LINK_PATHS/);
  assert.match(css, /admin-layout--menu-closed/);
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1024px\)/);
});

test('Admin mobile Communications label is compact while retaining its full accessible name', async () => {
  const mobile = await readSource('../src/components/layout/MobileBottomNav.tsx');
  assert.match(mobile, /item\.label === 'Communications'[\s\S]*?'Comms'/);
  assert.match(mobile, /aria-label=\{item\.label\}/);
  assert.match(mobile, /title=\{item\.label\}/);
});
