import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clearAdminDraft, readAdminDraft, writeAdminDraft } from '../src/utils/adminDrafts.js';
import { createKeyedSingleFlight } from '../src/utils/keyedSingleFlight.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const isTextDraft = (value) => (
  Boolean(value)
  && typeof value === 'object'
  && typeof value.text === 'string'
);

test('parallel authorization triggers share one in-flight request', async () => {
  const requests = createKeyedSingleFlight();
  let callCount = 0;
  let complete;
  const operation = () => {
    callCount += 1;
    return new Promise((resolve) => { complete = resolve; });
  };

  const first = requests.run('staff-1:session-a', operation);
  const second = requests.run('staff-1:session-a', operation);
  assert.strictEqual(first, second);
  await Promise.resolve();
  assert.equal(callCount, 1);
  complete('verified');
  assert.deepEqual(await Promise.all([first, second]), ['verified', 'verified']);
  assert.equal(requests.has('staff-1:session-a'), false);
});

test('a failed permission request can be retried and other accounts do not share requests', async () => {
  const requests = createKeyedSingleFlight();
  let attempts = 0;
  await assert.rejects(requests.run('staff-1:session-a', async () => {
    attempts += 1;
    throw new Error('Temporary network failure');
  }), /Temporary network failure/);

  assert.equal(await requests.run('staff-1:session-a', async () => {
    attempts += 1;
    return 'recovered';
  }), 'recovered');
  assert.equal(await requests.run('staff-2:session-b', async () => 'separate'), 'separate');
  assert.equal(attempts, 2);
});

test('drafts survive reload/navigation, expire, and remain isolated by administrator account', () => {
  const storage = new MemoryStorage();
  const data = { text: 'unfinished job content' };
  assert.deepEqual(writeAdminDraft('staff-1', 'job-creation', data, storage, 1000), { ok: true, error: null });
  assert.deepEqual(readAdminDraft('staff-1', 'job-creation', isTextDraft, storage, 2000), { draft: data, error: null });
  assert.deepEqual(readAdminDraft('staff-2', 'job-creation', isTextDraft, storage, 2000), { draft: null, error: null });

  assert.deepEqual(readAdminDraft('staff-1', 'job-creation', isTextDraft, storage, 1000 + 30 * 24 * 60 * 60 * 1000 + 1), { draft: null, error: null });
  assert.equal(storage.values.size, 0);
});

test('draft validation rejects malformed data and explicit discard removes only that account draft', () => {
  const storage = new MemoryStorage();
  writeAdminDraft('staff-1', 'job-creation', { text: 10 }, storage, 1000);
  writeAdminDraft('staff-2', 'job-creation', { text: 'keep' }, storage, 1000);
  assert.equal(readAdminDraft('staff-1', 'job-creation', isTextDraft, storage, 1000).draft, null);
  assert.deepEqual(clearAdminDraft('staff-1', 'job-creation', storage), { ok: true, error: null });
  assert.deepEqual(readAdminDraft('staff-2', 'job-creation', isTextDraft, storage, 1000), { draft: { text: 'keep' }, error: null });
});

test('admin pages restore drafts and clear them only after save, successful submission, or discard', async () => {
  const [layout, app, jobs, content, communications] = await Promise.all([
    readSource('../src/layouts/AdminLayout.tsx'),
    readSource('../src/App.tsx'),
    readSource('../src/pages/admin/AdminJobsPage.tsx'),
    readSource('../src/pages/admin/AdminContentPage.tsx'),
    readSource('../src/pages/admin/AdminCommunicationsPage.tsx'),
  ]);

  assert.match(layout, /if \(isBackgroundRefresh\) setPermissionRefreshError/);
  assert.match(layout, /<Outlet context={adminPermissionState} \/>/);
  assert.match(app, /path="\/admin" element={<ProtectedRoute allowedRoles=\{\['ADMIN'\]\}><AdminLayout \/><\/ProtectedRoute>}>[\s\S]*?path="jobs" element={<AdminJobsPage \/>}/);
  assert.match(jobs, /readAdminDraft<AdminJobCreationDraft>/);
  assert.match(jobs, /writeAdminDraft\(adminUserId, 'job-creation'/);
  assert.match(jobs, /clearAdminDraft\(adminUserId, 'job-creation'\)/);
  assert.match(content, /readAdminDraft<Partial<SiteContent/);
  assert.match(content, /writeAdminDraft\(adminUserId, `site-content:\$\{page\}`/);
  assert.match(content, /clearAdminDraft\(adminUserId, `site-content:\$\{selectedPage\}`\)/);
  assert.match(communications, /readAdminDraft<AdminCampaignDraft>/);
  assert.match(communications, /writeAdminDraft\(adminUserId, "communications-campaign"/);
  assert.match(communications, /clearAdminDraft\(adminUserId, "communications-campaign"\)/);
  assert.match(communications, /readAdminDraft<Editor>/);
  assert.match(communications, /writeAdminDraft\(adminUserId, templateDraftId, editor\)/);
  assert.match(communications, /clearAdminDraft\(adminUserId, templateDraftId\)/);
  assert.match(communications, /Discard changes/);
  assert.match(communications, /operationalContentConfirmed: false/);
});

test('permission revalidation retains existing page on temporary failure and applies refreshed permissions', async () => {
  const [layout, navigation] = await Promise.all([
    readSource('../src/layouts/AdminLayout.tsx'),
    readSource('../src/utils/adminNavigation.js'),
  ]);

  assert.match(layout, /else if \(isBackgroundRefresh\) \{\s*setPermissionRefreshError/);
  assert.match(layout, /result\.status === 401 \|\| result\.status === 403/);
  assert.match(layout, /setAdminPermissionState\(\{ status: 'ready', data: result\.data\.data \}\)/);
  assert.match(navigation, /to: '\/admin\/jobs'.*permissions: \['jobs\.view'\]/);
});

test('transient initial session verification errors preserve the token for secure retry', async () => {
  const [authContext, protectedRoute] = await Promise.all([
    readSource('../src/context/AuthContext.tsx'),
    readSource('../src/components/auth/ProtectedRoute.tsx'),
  ]);
  assert.match(authContext, /result\.status === 0 \|\| result\.status >= 500/);
  assert.match(authContext, /setAuthBootstrapError\(result\.error\.message/);
  assert.match(authContext, /else \{\s*clearSession\(\);/);
  assert.match(authContext, /retryAuthBootstrap/);
  assert.match(protectedRoute, /if \(authBootstrapError\)[\s\S]*?Retry session verification/);
  assert.match(protectedRoute, /if \(!user\)/);
});
