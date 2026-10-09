import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAvailableCvExportSections,
  getFullCvExportData,
  getSelectedCvExportData,
} from '../src/utils/cvExportData.ts';

const cv = {
  personalInfo: {
    fullName: 'Avery Example',
    title: 'Engineer',
    email: 'avery@example.test',
    phone: '',
    location: '',
    website: 'https://example.test',
    linkedin: '',
  },
  summary: 'Builds accessible products.',
  experience: [
    { jobTitle: 'Engineer', company: 'Example Ltd', startDate: '2022', endDate: '', currentlyWorking: true, description: 'Built reliable software.' },
    { jobTitle: '', company: '', startDate: '', endDate: '', currentlyWorking: false, description: '' },
  ],
  education: [
    { degree: 'BSc', school: 'Example University', year: '2021', details: 'Honors' },
    { degree: '', school: '', year: '', details: '' },
  ],
  skills: ['TypeScript', '  '],
  certifications: [
    { name: 'Cloud Certificate', issuer: 'Example Org' },
    { name: '', issuer: '' },
  ],
  languages: [{ name: 'French', proficiency: 'Conversational' }],
  projects: [
    { name: 'Example project', description: 'Project details', technologies: ['React', ' '], projectUrl: '', githubUrl: '', startDate: '', endDate: '' },
    { name: '', description: '', technologies: [], projectUrl: '', githubUrl: '', startDate: '', endDate: '' },
  ],
};

test('full CV data keeps populated details and drops blank entries', () => {
  const result = getFullCvExportData(cv);

  assert.equal(result.education[0].details, 'Honors');
  assert.equal(result.experience.length, 1);
  assert.equal(result.education.length, 1);
  assert.deepEqual(result.skills, ['TypeScript']);
  assert.equal(result.certifications.length, 1);
  assert.equal(result.projects.length, 1);
  assert.deepEqual(result.projects[0].technologies, ['React']);
});

test('available sections include populated supported data only', () => {
  assert.deepEqual(getAvailableCvExportSections(cv), [
    'summary',
    'experience',
    'education',
    'skills',
    'certifications',
    'links',
    'languages',
    'projects',
  ]);
});

test('selected content exports checked sections while full CV keeps all populated sections', () => {
  const selected = getSelectedCvExportData(cv, ['education', 'links']);
  const full = getSelectedCvExportData(cv, getAvailableCvExportSections(cv));

  assert.equal(selected.personalInfo.fullName, 'Avery Example');
  assert.equal(selected.personalInfo.website, 'https://example.test');
  assert.equal(selected.summary, '');
  assert.equal(selected.experience.length, 0);
  assert.equal(selected.education.length, 1);
  assert.deepEqual(selected.skills, []);
  assert.equal(selected.projects?.length, 0);
  assert.equal(full.summary, cv.summary);
  assert.equal(full.experience.length, 1);
  assert.equal(full.projects?.length, 1);
  assert.equal(full.languages?.length, 1);
});

test('selected sections can be independently deselected without affecting full CV exports', () => {
  const allPopulatedSections = getAvailableCvExportSections(cv);
  const selectedSections = allPopulatedSections.filter((section) => section !== 'experience' && section !== 'languages');
  const selected = getSelectedCvExportData(cv, selectedSections);
  const full = getFullCvExportData(cv);

  assert.deepEqual(selected.experience, []);
  assert.deepEqual(selected.languages, []);
  assert.equal(selected.education.length, 1);
  assert.equal(selected.personalInfo.website, 'https://example.test');
  assert.equal(full.experience.length, 1);
  assert.equal(full.languages?.length, 1);
});
