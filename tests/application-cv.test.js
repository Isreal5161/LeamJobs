import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { createServer } from 'vite';

let vite;
let cvUtils;

before(async () => {
  vite = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  cvUtils = await vite.ssrLoadModule('/src/utils/applicationCv.ts');
});

after(async () => {
  await vite?.close();
});

const applicant = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.test',
  professionalTitle: 'Engineer',
  cvTemplate: 'professional',
  bio: 'Current profile summary',
  skills: ['Current profile skill'],
  experience: [],
  education: [],
  certifications: [],
  languages: [],
  projects: [],
};

const snapshot = {
  personalInfo: { fullName: 'Ada at submission', title: 'Engineer', email: 'ada@example.test' },
  summary: 'Saved application summary',
  experience: [],
  education: [],
  skills: ['Saved application skill'],
  certifications: [],
};

test('saved application snapshot wins over a conflicting uploaded-CV source', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'application', submittedAt: '2026-01-01', version: 'upload-v2' },
    cvSnapshot: {
      templateId: 'ats',
      templateVersion: cvUtils.CURRENT_CV_TEMPLATE_VERSION,
      snapshotCapturedAt: '2025-12-31',
      snapshot,
    },
  }, applicant);

  assert.equal(view.available, true);
  assert.equal(view.source, 'template');
  assert.equal(view.isHistorical, true);
  assert.equal(view.submittedAt, '2025-12-31');
  assert.equal(view.version, cvUtils.CURRENT_CV_TEMPLATE_VERSION);
  assert.equal(view.template, 'ats');
  assert.equal(view.templateData, snapshot);
  assert.equal(view.templateVersionSupported, true);
});

test('application-specific upload is selected when no snapshot exists', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'application', submittedAt: '2026-02-01', version: 'resume-v3' },
  }, applicant);

  assert.deepEqual(view, {
    available: true,
    source: 'application',
    isHistorical: true,
    unavailableReason: null,
    submittedAt: '2026-02-01',
    version: 'resume-v3',
    template: 'modern',
    templateData: null,
    templateVersionSupported: true,
  });
});

test('current profile upload is identified as a non-historical fallback', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'profile', submittedAt: '2026-01-01', version: 'profile-version' },
  }, applicant);

  assert.equal(view.available, true);
  assert.equal(view.source, 'profile');
  assert.equal(view.isHistorical, false);
  assert.equal(view.submittedAt, null);
  assert.equal(view.version, null);
  assert.equal(view.templateData, null);
});

test('current profile template data is mapped as a fallback, not an application snapshot', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'template' },
  }, applicant);

  assert.equal(view.source, 'template');
  assert.equal(view.isHistorical, false);
  assert.equal(view.template, 'professional');
  assert.equal(view.templateData?.summary, 'Current profile summary');
  assert.deepEqual(view.templateData?.skills, ['Current profile skill']);
});

test('missing CV sources and incomplete application data resolve safely to unavailable', () => {
  for (const value of [null, undefined, {}, { resume: null }, { resume: { available: false, source: 'profile' } }]) {
    const view = cvUtils.resolveApplicationCvView(value, null);
    assert.equal(view.available, false);
    assert.equal(view.source, null);
    assert.equal(view.isHistorical, false);
    assert.equal(view.templateData, null);
  }
});

test('URL-only CV references are unavailable and never fall through to a current profile CV', () => {
  const applicationUrlOnly = cvUtils.resolveApplicationCvView({
    resume: { available: false, source: null, unavailableReason: 'storage_reference_missing' },
  }, { ...applicant, cvTemplate: 'professional' });
  const profileUrlOnly = cvUtils.resolveApplicationCvView({
    resume: { available: false, source: null, unavailableReason: 'storage_reference_missing' },
  }, { ...applicant, cvTemplate: null });

  for (const view of [applicationUrlOnly, profileUrlOnly]) {
    assert.equal(view.available, false);
    assert.equal(view.source, null);
    assert.equal(view.unavailableReason, 'storage_reference_missing');
    assert.equal(view.templateData, null);
  }
});

test('incomplete profile fields and non-array CV sections map to safe empty values', () => {
  const data = cvUtils.currentProfileCvData({
    fullName: 'Ada Lovelace',
    experience: 'not-an-array',
    education: null,
    skills: undefined,
    projects: [{ name: 'Project', technologies: null }],
  });

  assert.equal(data.personalInfo.fullName, 'Ada Lovelace');
  assert.equal(data.personalInfo.email, '');
  assert.deepEqual(data.experience, []);
  assert.deepEqual(data.education, []);
  assert.deepEqual(data.skills, []);
  assert.deepEqual(data.projects[0].technologies, []);
  assert.deepEqual(cvUtils.currentProfileCvData(null).experience, []);
});

test('unsupported saved template versions are reported instead of treated as current', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'template' },
    cvSnapshot: { templateVersion: '0', snapshot },
  }, applicant);

  assert.equal(view.source, 'template');
  assert.equal(view.version, '0');
  assert.equal(view.templateVersionSupported, false);
});

test('snapshot metadata without usable saved content never falls through to current profile data', () => {
  const view = cvUtils.resolveApplicationCvView({
    resume: { available: true, source: 'template' },
    cvSnapshot: { templateId: 'professional', templateVersion: null, snapshot: null },
  }, applicant);

  assert.equal(view.available, false);
  assert.equal(view.source, null);
  assert.equal(view.isHistorical, false);
  assert.equal(view.templateData, null);
});

test('unknown template identifiers fall back to the supported default template', () => {
  assert.equal(cvUtils.cvTemplateId('unsupported'), 'modern');
  assert.equal(cvUtils.cvTemplateId(null), 'modern');
});
