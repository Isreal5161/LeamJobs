import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('staff management API client matches the existing Stage 3 routes and methods', async () => {
  const api = await readSource('../src/services/api.ts');

  const expectedRequests = [
    [/method: 'GET',\s+endpoint: `\/admin\/staff\?page=\$\{page\}&limit=\$\{limit\}`/, 'staff list'],
    [/method: 'GET',\s+endpoint: `\/admin\/staff\/invitations\?page=\$\{page\}&limit=\$\{limit\}`/, 'invitation list'],
    [/method: 'GET',\s+endpoint: '\/admin\/staff\/permissions'/, 'permission catalogue'],
    [/method: 'POST',\s+endpoint: '\/admin\/staff\/invitations'/, 'invitation creation'],
    [/method: 'GET',\s+endpoint: `\/admin\/staff\/\$\{encodeURIComponent\(userId\)\}`/, 'staff details'],
    [/method: 'POST',\s+endpoint: `\/admin\/staff\/invitations\/\$\{encodeURIComponent\(invitationId\)\}\/resend`/, 'invitation resend'],
    [/method: 'POST',\s+endpoint: `\/admin\/staff\/invitations\/\$\{encodeURIComponent\(invitationId\)\}\/revoke`/, 'invitation revocation'],
    [/method: 'PATCH',\s+endpoint: `\/admin\/staff\/\$\{encodeURIComponent\(userId\)\}\/permissions`/, 'permission updates'],
    [/method: 'POST',\s+endpoint: `\/admin\/staff\/\$\{encodeURIComponent\(userId\)\}\/suspend`/, 'staff suspension'],
    [/method: 'POST',\s+endpoint: `\/admin\/staff\/\$\{encodeURIComponent\(userId\)\}\/reactivate`/, 'staff reactivation'],
    [/method: 'GET',\s+endpoint: `\/admin\/staff\/\$\{encodeURIComponent\(userId\)\}\/audit\?page=\$\{page\}&limit=\$\{limit\}`/, 'staff audit history'],
    [/method: 'POST',\s+endpoint: '\/auth\/admin-invitations\/accept'/, 'invitation acceptance'],
  ];

  for (const [pattern, name] of expectedRequests) {
    assert.match(api, pattern, `Missing or changed request for ${name}`);
  }
});

test('invitation acceptance captures the fragment token and removes it before form use', async () => {
  const [page, app] = await Promise.all([
    readSource('../src/pages/admin/AdminInvitationAcceptancePage.tsx'),
    readSource('../src/App.tsx'),
  ]);

  assert.match(page, /window\.location\.hash\.slice\(1\)/);
  assert.match(page, /window\.history\.replaceState/);
  assert.ok(page.indexOf('window.history.replaceState') < page.indexOf('setToken(capturedToken)'));
  assert.match(page, /acceptAdminStaffInvitation\(\{/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|console\.(log|error|warn)/);
  assert.match(app, /path="\/admin\/accept-invitation"/);
  assert.match(app, /<AdminInvitationAcceptancePage \/>/);
});

test('admin navigation visibility is based on the current-user effective permission endpoint', async () => {
  const [layout, topbar, mobileNav, staffPage] = await Promise.all([
    readSource('../src/layouts/AdminLayout.tsx'),
    readSource('../src/components/layout/DashboardTopbar.tsx'),
    readSource('../src/components/layout/MobileBottomNav.tsx'),
    readSource('../src/pages/admin/AdminStaffPage.tsx'),
  ]);

  const api = await readSource('../src/services/api.ts');
  assert.match(layout, /getCurrentAdminPermissions\(token\)/);
  assert.match(layout, /result\.status === 403/);
  assert.match(layout, /status: 'loading'/);
  assert.match(layout, /status: 'error'/);
  assert.match(layout, /onClick=\{\(\) => void loadAdminPermissions\(\)\}>Retry/);
  assert.match(layout, /isAdminRouteAllowed\(pathname, adminPermissionState\)/);
  assert.match(topbar, /ADMIN_HEADER_LINK_PATHS/);
  assert.match(mobileNav, /ADMIN_MOBILE_LINK_PATHS/);
  assert.match(api, /endpoint: '\/admin\/me\/permissions'/);
  assert.match(staffPage, /setAccessDenied\(failure\.status === 403\)/);
});
