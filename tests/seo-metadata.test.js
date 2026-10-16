import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getJobPageMetadata,
  getJobPostingStructuredData,
  getPageMetadata,
  isJobApplicationDeadlineExpired,
} from '../src/utils/seoMetadata.ts';

test('public landing pages have distinct canonical metadata', () => {
  const home = getPageMetadata('/');
  const jobs = getPageMetadata('/jobs/');

  assert.equal(home.canonicalUrl, 'https://leamjobs.com/');
  assert.equal(home.robots, 'index,follow');
  assert.match(home.title, /LeamJobs.*Nigeria/);
  assert.equal(jobs.canonicalUrl, 'https://leamjobs.com/jobs');
  assert.notEqual(jobs.title, home.title);
  assert.match(jobs.description, /jobs and vacancies/i);
});

test('private and unsupported routes are not indexable or canonicalized', () => {
  const privateRoute = getPageMetadata('/seeker/jobs/job-123');
  const unknownRoute = getPageMetadata('/not-a-public-page');

  assert.equal(privateRoute.robots, 'noindex,follow');
  assert.equal(privateRoute.canonicalUrl, null);
  assert.equal(unknownRoute.robots, 'noindex,follow');
  assert.equal(unknownRoute.canonicalUrl, null);
});

test('job metadata uses real job details and bounds the description', () => {
  const metadata = getJobPageMetadata({
    title: 'Senior Product Designer',
    company: { name: 'Example Studio' },
    location: 'Lagos, Nigeria',
    description: `<p>${'Design useful products for Nigerian customers. '.repeat(8)}</p>`,
  });

  assert.match(metadata.title, /Senior Product Designer/);
  assert.match(metadata.title, /Example Studio/);
  assert.match(metadata.title, /Lagos, Nigeria/);
  assert.match(metadata.title, /LeamJobs/);
  assert.match(metadata.description, /Example Studio/);
  assert.match(metadata.description, /Lagos, Nigeria/);
  assert.ok(metadata.description.length <= 160);
  assert.doesNotMatch(metadata.description, /<[^>]*>/);
});

test('JobPosting structured data uses actual required fields and available compensation', () => {
  const now = new Date('2026-10-16T12:00:00.000Z');
  const job = {
    id: 'job-123',
    title: 'Operations Analyst',
    description: 'Analyse business operations and report findings.',
    location: 'Abuja, Nigeria',
    employerId: 'employer-123',
    jobType: 'NORMAL_EMPLOYMENT',
    engagementType: 'MONTHLY',
    skills: [],
    requirements: null,
    responsibilities: [],
    benefits: [],
    createdAt: '2026-10-01T09:00:00.000Z',
    applicationDeadline: '2026-11-01T00:00:00.000Z',
    company: {
      name: 'Example Group',
      description: null,
      website: null,
      industry: null,
      size: null,
      location: null,
      logoUrl: null,
    },
    compensation: {
      type: 'EMPLOYMENT',
      engagementType: 'MONTHLY',
      salaryMin: '250000',
      salaryMax: '350000',
      currency: 'NGN',
      salaryPeriod: 'MONTHLY',
    },
  };
  const structuredData = getJobPostingStructuredData(job, 'https://leamjobs.com/jobs/job-123', now);

  assert.ok(structuredData);
  assert.equal(structuredData['@type'], 'JobPosting');
  assert.equal(structuredData.title, job.title);
  assert.equal(structuredData.description, job.description);
  assert.equal(structuredData.datePosted, job.createdAt);
  assert.equal(structuredData.validThrough, job.applicationDeadline);
  assert.deepEqual(structuredData.hiringOrganization, { '@type': 'Organization', name: job.company.name });
  assert.equal(structuredData.jobLocation.address.addressLocality, job.location);
  assert.deepEqual(structuredData.baseSalary.value, {
    '@type': 'QuantitativeValue',
    minValue: 250000,
    maxValue: 350000,
    unitText: 'MONTH',
  });
  assert.equal(JSON.parse(JSON.stringify(structuredData))['@context'], 'https://schema.org');
});

test('JobPosting data omits unknown fields and excludes expired or incomplete jobs', () => {
  const job = {
    id: 'job-456',
    title: 'Freelance Designer',
    description: 'Design project assets.',
    location: 'Lagos, Nigeria',
    employerId: 'employer-456',
    jobType: 'FREELANCE_PROJECT',
    engagementType: 'FREELANCE',
    skills: [],
    requirements: null,
    responsibilities: [],
    benefits: [],
    createdAt: '2026-10-01T09:00:00.000Z',
    applicationDeadline: null,
    company: {
      name: 'Studio Example',
      description: null,
      website: null,
      industry: null,
      size: null,
      location: null,
      logoUrl: null,
    },
    compensation: null,
  };
  const now = new Date('2026-10-16T12:00:00.000Z');
  const data = getJobPostingStructuredData(job, 'https://leamjobs.com/jobs/job-456', now);

  assert.ok(data);
  assert.equal(data.employmentType, 'CONTRACTOR');
  assert.equal('baseSalary' in data, false);
  assert.equal('validThrough' in data, false);
  assert.equal(getJobPostingStructuredData({ ...job, title: '' }, 'https://leamjobs.com/jobs/job-456', now), null);
  assert.equal(getJobPostingStructuredData({ ...job, applicationDeadline: '2026-10-16T12:00:00.000Z' }, 'https://leamjobs.com/jobs/job-456', now), null);
  assert.equal(isJobApplicationDeadlineExpired({ ...job, applicationDeadline: '2026-10-16T12:00:00.000Z' }, now), true);
});
