import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('admin sidebar links use registered routes and preserve gated staff navigation', async () => {
  const [sidebar, navigation, app, layout] = await Promise.all([
    readFile(new URL('../src/components/layout/DashboardSidebar.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/utils/adminNavigation.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/AdminLayout.tsx', import.meta.url), 'utf8'),
  ]);
  const registeredRoutes = new Set(['/admin']);

  for (const [, path] of app.matchAll(/<Route\s+path="([^"]+)"/g)) {
    registeredRoutes.add(path.startsWith('/') ? path : `/admin/${path}`);
  }

  const adminLinks = [...navigation.matchAll(/to: '(\/admin\/[^']+)'/g)].map(([, path]) => path);
  assert.ok(adminLinks.length > 0);
  for (const path of adminLinks) {
    assert.ok(registeredRoutes.has(path), `Sidebar link ${path} must have a registered admin route`);
  }

  assert.match(sidebar, /className=\{\(\{ isActive \}\) => `dashboard-menu__link \$\{isActive/);
  assert.match(sidebar, /getVisibleAdminNavigationSections\(adminPermissionState\)/);
  assert.match(layout, /<DashboardSidebar[\s\S]*?adminPermissionState=\{adminPermissionState\}/);
  assert.match(layout, /<MobileBottomNav adminPermissionState=\{adminPermissionState\} \/>/);
  assert.match(layout, /isAdminRouteAllowed\(pathname, adminPermissionState\)/);
});
