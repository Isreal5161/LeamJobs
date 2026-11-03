import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

let vite;
let CVTemplateRenderer;
let ApplicationCoverLetter;
let api;

before(async () => {
  vite = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  ({ default: CVTemplateRenderer } = await vite.ssrLoadModule('/src/components/cv-templates/CVTemplateRenderer.tsx'));
  ({ default: ApplicationCoverLetter } = await vite.ssrLoadModule('/src/components/employer/ApplicationCoverLetter.tsx'));
  api = await vite.ssrLoadModule('/src/services/api.ts');
});

after(async () => {
  await vite?.close();
});

const savedCv = {
  personalInfo: { fullName: 'Saved Candidate', title: 'Original Role', email: 'saved@example.test' },
  summary: 'Saved application CV content',
  experience: [],
  education: [],
  skills: ['Original skill'],
  certifications: [],
};

test('CV template renderer outputs the saved snapshot content', () => {
  const markup = renderToStaticMarkup(React.createElement(CVTemplateRenderer, {
    data: savedCv,
    template: 'professional',
    templateVersion: '1',
  }));

  assert.match(markup, /Saved Candidate/);
  assert.match(markup, /Saved application CV content/);
  assert.match(markup, /Original skill/);
});

test('CV template renderer refuses to represent an unsupported version as the original', () => {
  const markup = renderToStaticMarkup(React.createElement(CVTemplateRenderer, {
    data: savedCv,
    template: 'professional',
    templateVersion: '0',
  }));

  assert.match(markup, /template version that this application cannot render/);
  assert.doesNotMatch(markup, /Saved application CV content/);
});

test('cover letter component renders every line and preserves paragraphs as text', () => {
  const letter = 'First paragraph.\n\nSecond paragraph with a long URL https://example.test/a-very-long-path.';
  const markup = renderToStaticMarkup(React.createElement(ApplicationCoverLetter, { coverLetter: letter }));

  assert.match(markup, /First paragraph\.\n\nSecond paragraph with a long URL https:\/\/example\.test\/a-very-long-path\./);
  assert.match(markup, /applicant-cover-letter__content/);
});

test('cover letter component renders long text intact and gives an empty-state message', () => {
  const longLetter = 'Complete application cover letter. '.repeat(400);
  const longMarkup = renderToStaticMarkup(React.createElement(ApplicationCoverLetter, { coverLetter: longLetter }));
  const emptyMarkup = renderToStaticMarkup(React.createElement(ApplicationCoverLetter, { coverLetter: '  \n ' }));

  assert.ok(longMarkup.includes(longLetter));
  assert.match(emptyMarkup, /No cover letter submitted\./);
});

test('applicant detail CV modal is portaled, accessible, dismissible, and cleans up resources', async () => {
  const [page, styles] = await Promise.all([
    readSource('../src/pages/employer/EmployerApplicantsPage.tsx'),
    readSource('../src/styles/employer-applicants.css'),
  ]);

  assert.match(page, /createPortal\([\s\S]*document\.body/);
  assert.match(page, /role="dialog" aria-modal="true" aria-labelledby=/);
  assert.match(page, /event\.key === 'Escape'[\s\S]*closeCvModal\(\)/);
  assert.match(page, /event\.target === event\.currentTarget[\s\S]*closeCvModal\(\)/);
  assert.match(page, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(page, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(page, /cvModalRef\.current\.querySelectorAll/);
  assert.match(page, /URL\.revokeObjectURL\(cvDocumentUrl\)/);
  assert.match(page, /isSelectedApplicationCurrent && selectedApplication && applicant/);
  assert.match(page, /setSelectedApplication\(null\)/);
  assert.match(page, /cvModalState === 'loading'/);
  assert.match(page, /cvModalState === 'unavailable'/);
  assert.match(page, /cvModalState === 'error'/);
  assert.match(page, /cvModalState === 'pdf'/);
  assert.match(page, /cvModalState === 'template'/);
  assert.match(styles, /\.employer-cv-modal-backdrop\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*10000/s);
  const coverLetterStyles = styles.match(/\.applicant-detail-pane \.applicant-cover-letter__content\s*\{[^}]*\}/)?.[0] ?? '';
  assert.match(coverLetterStyles, /white-space:\s*pre-wrap/);
  assert.match(coverLetterStyles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(coverLetterStyles, /line-clamp|max-height|overflow:\s*hidden/);
  assert.match(page, /<ApplicationCoverLetter coverLetter=\{selectedApplication\.coverLetter\} \/>/);
  assert.match(page, /selectedApplication\?\.id === selectedListItem\.id/);
});

test('admin viewer requests the authorized application endpoint and ignores stale CV responses', async () => {
  const source = await readSource('../src/pages/admin/AdminApplicantDetailPage.tsx');
  const api = await readSource('../src/services/api.ts');

  assert.match(source, /getAdminJobApplicationResume\(jobId, applicationId, token\)/);
  assert.match(source, /if \(requestVersion !== resumeRequestVersion\.current\) return/);
  assert.match(source, /resumeRequestVersion\.current \+= 1/);
  assert.match(source, /setResumeObjectUrl\(null\)/);
  assert.match(api, /\/admin\/jobs\/\$\{encodeURIComponent\(jobId\)\}\/applications\/\$\{encodeURIComponent\(applicationId\)\}\/resume/);
});

test('both employer viewers use the shared CV resolver and authenticated application endpoint', async () => {
  const [applicants, candidates, api] = await Promise.all([
    readSource('../src/pages/employer/EmployerApplicantsPage.tsx'),
    readSource('../src/pages/employer/EmployerCandidatesPage.tsx'),
    readSource('../src/services/api.ts'),
  ]);

  for (const source of [applicants, candidates]) {
    assert.match(source, /resolveApplicationCvView\(/);
    assert.match(source, /getEmployerApplicationResume\(/);
    assert.match(source, /current profile CV/i);
    assert.match(source, /The saved CV snapshot content is unavailable/);
  }
  assert.match(applicants, /getEmployerApplicationResume\(selectedListItem\.jobId, selectedListItem\.id, token\)/);
  assert.doesNotMatch(applicants, /fetch\([^)]*resumeUrl/);
  assert.match(applicants, /if \(requestVersion !== cvRequestVersion\.current\) return/);
  assert.match(applicants, /disabled=\{!cvView\?\.available \|\| isOpeningResume\}/);
  assert.match(applicants, /cvView\?\.unavailableReason === 'storage_reference_missing'/);
  assert.match(candidates, /cvRequestVersion\.current !== version/);
  assert.match(api, /\/employer\/jobs\/\$\{encodeURIComponent\(jobId\)\}\/applications\/\$\{encodeURIComponent\(applicationId\)\}\/resume/);
});

test('employer CV API sends the application-specific endpoint with bearer authentication', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl;
  let capturedOptions;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(new Blob(['application PDF']), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  };

  try {
    const result = await api.getEmployerApplicationResume('job/id', 'application id', 'session-token');
    assert.equal(result.ok, true);
    assert.equal(result.data.type, 'application/pdf');
    assert.match(capturedUrl, /\/employer\/jobs\/job%2Fid\/applications\/application%20id\/resume$/);
    assert.equal(capturedOptions.headers.Authorization, 'Bearer session-token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
