import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('footer and popup submit through the same API helper and wait for an API success response', async () => {
  const [footer, popup, api] = await Promise.all([
    readSource('../src/components/layout/Footer.tsx'),
    readSource('../src/components/public/JobUpdatesSubscriptionPopup.tsx'),
    readSource('../src/services/api.ts'),
  ]);

  for (const component of [footer, popup]) {
    assert.match(component, /subscribeToJobUpdates\(email\)/);
    assert.match(component, /if \(result\.ok\)/);
    assert.match(component, /submissionInProgress\.current/);
  }
  assert.match(footer, /disabled=\{isSubmitting\}/);
  assert.match(popup, /disabled=\{status === 'submitting'\}/);
  assert.match(api, /endpoint: '\/jobs\/job-updates\/subscribe'/);
  assert.match(api, /email: email\.trim\(\)\.toLowerCase\(\)/);
});

test('public newsletter wording stays limited to job updates', async () => {
  const [footer, popup, admin] = await Promise.all([
    readSource('../src/components/layout/Footer.tsx'),
    readSource('../src/components/public/JobUpdatesSubscriptionPopup.tsx'),
    readSource('../src/pages/admin/AdminCommunicationsPage.tsx'),
  ]);

  assert.match(footer, /Optional job updates/);
  assert.match(popup, /new job opportunities and important job updates/);
  assert.match(admin, /Public newsletter subscribers \(job updates only\)/);
  assert.match(admin, /Keep this audience separate from general promotions and essential announcements/);
  assert.doesNotMatch(admin, /All Opt-in Recipients/);
});

test('admin recipient counts clear stale values and ignore out-of-order responses', async () => {
  const admin = await readSource('../src/pages/admin/AdminCommunicationsPage.tsx');

  assert.match(admin, /recipientCountRequestId = useRef\(0\)/);
  assert.match(admin, /const requestId = \+\+recipientCountRequestId\.current/);
  assert.match(admin, /if \(requestId !== recipientCountRequestId\.current\) return/);
  assert.match(admin, /setRecipientCount\(null\)/);
  assert.match(admin, /setRecipientCountLoading\(true\)/);
  assert.match(admin, /setRecipientCountError\(result\.error\.message/);
  assert.match(admin, /Checking eligible recipients\.\.\./);
});
