import assert from 'node:assert/strict';
import test from 'node:test';
import {
  employerIndustries,
  employerRegistrationTypes,
  getEmployerVerificationFailureMessage,
  getEmployerVerificationFieldErrors,
  getIndustryFormState,
  getIndustrySubmissionValue,
  getRegistrationTypeFormState,
  getRegistrationTypeSubmissionValue,
  normalizeOptionalHttpUrl,
} from '../src/utils/employerVerificationForm.ts';

test('optional company URLs accept bare domains and preserve paths and queries', () => {
  assert.deepEqual(normalizeOptionalHttpUrl(''), { value: '' });
  assert.deepEqual(normalizeOptionalHttpUrl('  www.example.com  '), {
    value: 'https://www.example.com/',
  });
  assert.deepEqual(normalizeOptionalHttpUrl('example.com/about?ref=jobs'), {
    value: 'https://example.com/about?ref=jobs',
  });
  assert.deepEqual(normalizeOptionalHttpUrl('example.com:8080/jobs'), {
    value: 'https://example.com:8080/jobs',
  });
  assert.deepEqual(normalizeOptionalHttpUrl('http://example.com/about'), {
    value: 'http://example.com/about',
  });
  assert.deepEqual(normalizeOptionalHttpUrl('https://www.example.com/company/LeamJobs'), {
    value: 'https://www.example.com/company/LeamJobs',
  });
});

test('optional company URLs reject malformed domains, whitespace, and unsafe schemes', () => {
  for (const value of [
    'not a domain',
    'https://example',
    'https://example..com',
    'https://-example.com',
    'https://user:password@example.com',
    'javascript:alert(1)',
    'example.com/path with spaces',
  ]) {
    assert.ok(normalizeOptionalHttpUrl(value).error, `${value} should be rejected`);
  }
});

test('industry and registration selectors provide the requested categories and CAC types', () => {
  for (const industry of [
    'Technology',
    'Digital Marketing',
    'Finance',
    'Education',
    'Healthcare',
    'Agriculture',
    'Construction',
    'Retail',
    'Logistics',
    'Real Estate',
    'Other',
  ]) {
    assert.ok(employerIndustries.includes(industry), `${industry} should be selectable`);
  }

  assert.deepEqual(
    employerRegistrationTypes.slice(0, 4).map(({ label }) => label),
    [
      'CAC (Nigeria) - Business Name (BN)',
      'CAC (Nigeria) - Private Limited Company (Ltd)',
      'CAC (Nigeria) - Public Limited Company (PLC)',
      'CAC (Nigeria) - Incorporated Trustees',
    ],
  );
  assert.equal(employerRegistrationTypes.at(-1)?.label, 'Other registration type');
});

test('saved industries and registration types remain readable without losing legacy values', () => {
  assert.deepEqual(getIndustryFormState('Technology'), { choice: 'Technology', custom: '' });
  assert.deepEqual(getIndustryFormState('Renewable energy'), { choice: 'Other', custom: 'Renewable energy' });
  assert.deepEqual(getRegistrationTypeFormState('BN'), { choice: 'BN', custom: '' });
  assert.deepEqual(getRegistrationTypeFormState('CAC'), { choice: 'CAC', custom: '' });
  assert.deepEqual(getRegistrationTypeFormState('OTHER'), { choice: 'OTHER', custom: 'OTHER' });
  assert.deepEqual(getRegistrationTypeFormState('CAC Private Limited Company (Ltd)'), {
    choice: 'CAC Private Limited Company (Ltd)',
    custom: '',
  });
  assert.deepEqual(getRegistrationTypeFormState('Other local registration'), {
    choice: 'OTHER',
    custom: 'Other local registration',
  });
  assert.equal(getIndustrySubmissionValue('Technology', ''), 'Technology');
  assert.equal(getIndustrySubmissionValue('Other', 'Renewable energy'), 'Renewable energy');
  assert.equal(getRegistrationTypeSubmissionValue('CAC Private Limited Company (Ltd)', ''), 'CAC Private Limited Company (Ltd)');
  assert.equal(getRegistrationTypeSubmissionValue('OTHER', 'OTHER'), 'OTHER');
  assert.equal(getRegistrationTypeSubmissionValue('OTHER', 'Local registration type'), 'Local registration type');
});

test('backend validation errors are limited to known form fields', () => {
  assert.deepEqual(getEmployerVerificationFieldErrors({
    'company.website': 'Website must be a valid URL',
    'company.linkedinUrl': 'LinkedIn URL must be a valid URL',
    'company.internalField': 'Internal details',
  }), {
    'company.website': 'Website must be a valid URL',
    'company.linkedinUrl': 'LinkedIn URL must be a valid URL',
  });
});

test('verification failures provide specific safe guidance for connectivity and upload limits', () => {
  assert.match(getEmployerVerificationFailureMessage(0, 'fallback'), /internet connection/);
  assert.match(getEmployerVerificationFailureMessage(413, 'fallback'), /10 MB or smaller/);
  assert.match(getEmployerVerificationFailureMessage(429, 'fallback'), /wait a moment/);
  assert.match(getEmployerVerificationFailureMessage(500, 'fallback'), /try again shortly/);
  assert.equal(getEmployerVerificationFailureMessage(400, 'Please review your details.'), 'Please review your details.');
  assert.equal(getEmployerVerificationFailureMessage(409, 'Verification is already under review.'), 'Verification is already under review.');
});
