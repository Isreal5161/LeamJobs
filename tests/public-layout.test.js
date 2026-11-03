import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public pages use the public footer without authenticated mobile navigation', async () => {
  const [publicLayout, seekerLayout, employerLayout, adminLayout] = await Promise.all([
    readFile(new URL('../src/layouts/PublicLayout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/SeekerLayout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/EmployerLayout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/layouts/AdminLayout.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(publicLayout, /<Footer \/>/);
  assert.doesNotMatch(publicLayout, /MobileBottomNav/);
  for (const authenticatedLayout of [seekerLayout, employerLayout, adminLayout]) {
    assert.match(authenticatedLayout, /<MobileBottomNav \/>/);
  }
});
