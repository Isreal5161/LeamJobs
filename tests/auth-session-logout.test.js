import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('frontend logout requests server revocation before clearing local authentication', async () => {
  const [authContext, api, navbar, topbar, adminLogin] = await Promise.all([
    readFile(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/services/api.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/layout/Navbar.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/layout/DashboardTopbar.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/admin/AdminLoginPage.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(api, /endpoint: '\/auth\/logout'/);
  assert.match(authContext, /const result = await logoutAuthSession\(token\)/);
  assert.match(authContext, /result\.status !== 401/);
  assert.ok(authContext.indexOf('const result = await logoutAuthSession(token)') < authContext.indexOf('clearSession();', authContext.indexOf('const result = await logoutAuthSession(token)')));
  assert.match(navbar, /await logout\(\)/);
  assert.match(navbar, /role="alert"/);
  assert.match(topbar, /await onLogout\?\.\(\)/);
  assert.match(topbar, /role="alert"/);
  assert.match(adminLogin, /await logout\(\)/);
});
