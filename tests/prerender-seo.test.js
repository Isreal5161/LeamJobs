import assert from 'node:assert/strict';
import test from 'node:test';
import {
  escapeHtml,
  generatePrerenderedPages,
  renderSeoHtml,
  runPrerender,
} from '../scripts/prerender-seo.mjs';
import { getPageMetadata } from '../src/utils/seoMetadata.ts';

const now = new Date('2026-10-16T12:00:00.000Z');
const template = `<!doctype html><html><head>
<title>Vite default</title><meta name="description" content="default">
<link rel="canonical" href="https://leamjobs.com/">
<meta property="og:title" content="default"><meta property="og:url" content="https://leamjobs.com/">
<meta name="twitter:card" content="summary"><script type="module" src="/assets/app.js"></script>
<style>#root[data-app-ready="false"] > .seo-prerender-content { visibility: hidden; }</style>
<noscript><style>#root[data-app-ready="false"] > .seo-prerender-content { visibility: visible; }</style></noscript>
</head><body><div id="root" data-app-ready="false"></div></body></html>`;

const completeJob = (overrides = {}) => ({
  id: 'job-123',
  employerId: 'employer-123',
  title: 'Backend Developer',
  description: 'Build and maintain reliable backend services.',
  location: 'Lagos, Nigeria',
  department: 'Engineering',
  workArrangement: 'REMOTE',
  engagementType: 'MONTHLY',
  jobType: 'NORMAL_EMPLOYMENT',
  skills: ['Node.js'],
  requirements: null,
  responsibilities: [],
  benefits: [],
  applicationDeadline: '2026-11-16T00:00:00.000Z',
  company: {
    name: 'Example Technology',
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
    salaryMin: '200000',
    salaryMax: '300000',
    currency: 'NGN',
    salaryPeriod: 'MONTHLY',
  },
  createdAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

test('HTML escaping protects visible content and attributes', () => {
  assert.equal(escapeHtml(`<script a="b">&'`), '&lt;script a=&quot;b&quot;&gt;&amp;&#39;');
});

test('homepage and Jobs page receive distinct initial metadata and canonical paths', () => {
  const generated = generatePrerenderedPages(template, [], now);
  const home = generated.get('index.html');
  const jobs = generated.get('jobs/index.html');

  assert.match(home, /<title>LeamJobs \| Find Jobs and Career Opportunities in Nigeria<\/title>/);
  assert.match(home, /<link rel="canonical" href="https:\/\/leamjobs\.com\/" \/>/);
  assert.match(home, /<h1>Find jobs and career opportunities in Nigeria<\/h1>/);
  assert.match(home, /id="root" data-app-ready="false">[\s\S]*Find jobs and career opportunities/);
  assert.match(home, /#root\[data-app-ready="false"\] > \.seo-prerender-content \{ visibility: hidden; \}/);
  assert.match(home, /<noscript><style>#root\[data-app-ready="false"\] > \.seo-prerender-content \{ visibility: visible; \}<\/style><\/noscript>/);
  assert.match(jobs, /<title>Jobs in Nigeria \| Find Vacancies and Career Opportunities \| LeamJobs<\/title>/);
  assert.match(jobs, /<link rel="canonical" href="https:\/\/leamjobs\.com\/jobs\/" \/>/);
  assert.match(jobs, /<h1>Find jobs and vacancies in Nigeria<\/h1>/);
  assert.equal((jobs.match(/rel="canonical"/g) ?? []).length, 1);
  assert.equal((jobs.match(/name="description"/g) ?? []).length, 1);
  assert.match(jobs, /src="\/assets\/app\.js"/);
  assert.deepEqual(getPageMetadata('/jobs').canonicalUrl, 'https://leamjobs.com/jobs/');
});

test('eligible jobs render real content, route metadata, canonical, and JSON-LD', () => {
  const job = completeJob();
  const generated = generatePrerenderedPages(template, [job], now);
  const html = generated.get('jobs/job-123/index.html');

  assert.match(html, /<title>Backend Developer at Example Technology in Lagos, Nigeria \| LeamJobs<\/title>/);
  assert.match(html, /<meta name="description" content="Backend Developer at Example Technology in Lagos, Nigeria\./);
  assert.match(html, /<link rel="canonical" href="https:\/\/leamjobs\.com\/jobs\/job-123\/" \/>/);
  assert.match(html, /property="og:url" content="https:\/\/leamjobs\.com\/jobs\/job-123\/"/);
  assert.match(html, /name="twitter:title" content="Backend Developer/);
  assert.match(html, /<h1>Backend Developer<\/h1>/);
  assert.match(html, /Build and maintain reliable backend services\./);
  assert.match(html, /href="\/jobs\/">Browse current jobs in Nigeria/);
  const scripts = [...html.matchAll(/<script id="leamjobs-job-posting-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const jsonLd = JSON.parse(scripts[0][1]);
  assert.equal(jsonLd['@type'], 'JobPosting');
  assert.equal(jsonLd.url, 'https://leamjobs.com/jobs/job-123/');
  assert.equal(jsonLd.hiringOrganization.name, 'Example Technology');
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
});

test('job HTML escapes unsafe values and serializes script-looking text safely', () => {
  const job = completeJob({
    title: 'Engineer <script>alert(1)</script>',
    description: 'Description </script><script>alert("x")</script> & safe',
    company: { ...completeJob().company, name: 'Company <img src=x onerror=alert(1)>' },
  });
  const html = generatePrerenderedPages(template, [job], now).get('jobs/job-123/index.html');

  assert.match(html, /Engineer &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Description &lt;\/script&gt;&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; safe/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(html, /<img src=x onerror=/);
  const scriptSafeHtml = renderSeoHtml(
    template,
    getPageMetadata('/jobs/job-123'),
    '<p>Safe</p>',
    { '@type': 'JobPosting', description: '</script><script>alert(1)</script>' },
  );
  assert.match(scriptSafeHtml, /\\u003c\/script\\u003e\\u003cscript\\u003e/);
  assert.equal((scriptSafeHtml.match(/<script\b/g) ?? []).length, 2);
});

test('expired jobs are omitted and incomplete jobs are noindex without JobPosting schema', () => {
  const expired = completeJob({ id: 'expired-job', applicationDeadline: '2026-10-16T12:00:00.000Z' });
  const incomplete = completeJob({
    id: 'incomplete-job',
    company: null,
    compensation: null,
  });
  const generated = generatePrerenderedPages(template, [expired, incomplete], now);

  assert.equal(generated.has('jobs/expired-job/index.html'), false);
  assert.doesNotMatch(generated.get('jobs/index.html'), /expired-job/);
  const incompleteHtml = generated.get('jobs/incomplete-job/index.html');
  assert.match(incompleteHtml, /<meta name="robots" content="noindex,follow" \/>/);
  assert.doesNotMatch(incompleteHtml, /rel="canonical"/);
  assert.doesNotMatch(incompleteHtml, /JobPosting/);
  assert.match(incompleteHtml, /does not include enough verified information/);
});

test('API failures abort prerender before writing generated pages', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'leamjobs-prerender-'));
  await mkdir(join(temporaryDirectory, 'dist'));
  await writeFile(join(temporaryDirectory, 'dist', 'index.html'), template);

  try {
    await assert.rejects(
      runPrerender({
        outputDir: join(temporaryDirectory, 'dist'),
        apiBaseUrl: 'https://example.test/api',
        fetchImpl: async () => new Response('not json', { status: 503 }),
        now,
      }),
      /HTTP 503/,
    );
    const { readdir } = await import('node:fs/promises');
    assert.deepEqual(await readdir(join(temporaryDirectory, 'dist')), ['index.html']);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('successful API pagination writes the prerendered jobs and detail files', async () => {
  const { mkdtemp, mkdir, readFile, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'leamjobs-prerender-success-'));
  const outputDir = join(temporaryDirectory, 'dist');
  const requests = [];
  await mkdir(outputDir);
  await writeFile(join(outputDir, 'index.html'), template);

  try {
    await runPrerender({
      outputDir,
      apiBaseUrl: 'https://example.test/api',
      now,
      fetchImpl: async (url) => {
        requests.push(new URL(url));
        const cursor = new URL(url).searchParams.get('cursor');
        const data = cursor
          ? { jobs: [completeJob({ id: 'job-second', title: 'Support Analyst' })], nextCursor: null }
          : { jobs: [completeJob()], nextCursor: 'page-two' };
        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    assert.equal(requests.length, 2);
    assert.equal(requests[0].pathname, '/api/jobs');
    assert.equal(requests[0].searchParams.get('limit'), '50');
    assert.equal(requests[1].searchParams.get('cursor'), 'page-two');
    assert.match(await readFile(join(outputDir, 'jobs', 'index.html'), 'utf8'), /Backend Developer/);
    assert.match(await readFile(join(outputDir, 'jobs', 'job-second', 'index.html'), 'utf8'), /Support Analyst/);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('invalid public job IDs cannot create output paths', async () => {
  const generated = generatePrerenderedPages(template, [completeJob({ id: 'job-valid' })], now);
  assert.ok(generated.has('jobs/job-valid/index.html'));
  assert.throws(() => generatePrerenderedPages(template, [completeJob({ id: '../unsafe' })], now), /invalid route ID/);
});
