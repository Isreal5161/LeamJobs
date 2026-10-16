import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(scriptDirectory, '..');
const outputDirectory = resolve(frontendDirectory, 'dist');
const MAX_JOB_PAGES = 50000;
const PAGE_SIZE = 50;

const metadataSource = await readFile(resolve(frontendDirectory, 'src/utils/seoMetadata.ts'), 'utf8');
const metadataJavascript = ts.transpileModule(metadataSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const metadata = await import(`data:text/javascript;base64,${Buffer.from(metadataJavascript).toString('base64')}`);

export const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const metaPropertyMatcher = (property) => new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*\\/?>`, 'gi');
const metaNameMatcher = (name) => new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*\\/?>`, 'gi');

const metadataMarkup = (pageMetadata) => {
  const values = [
    `<title>${escapeHtml(pageMetadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(pageMetadata.description)}" />`,
    `<meta name="robots" content="${escapeHtml(pageMetadata.robots)}" />`,
    `<meta property="og:title" content="${escapeHtml(pageMetadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(pageMetadata.description)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeHtml(pageMetadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(pageMetadata.description)}" />`,
  ];

  if (pageMetadata.canonicalUrl) {
    values.push(
      `<link rel="canonical" href="${escapeHtml(pageMetadata.canonicalUrl)}" />`,
      `<meta property="og:url" content="${escapeHtml(pageMetadata.canonicalUrl)}" />`,
    );
  }
  return values.join('\n');
};

export const renderSeoHtml = (template, pageMetadata, contentHtml, structuredData = null) => {
  let html = template;
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '');
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\/?>/gi, '');
  html = html.replace(metaNameMatcher('description'), '');
  html = html.replace(metaNameMatcher('robots'), '');
  for (const property of ['og:title', 'og:description', 'og:type', 'og:url']) {
    html = html.replace(metaPropertyMatcher(property), '');
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
    html = html.replace(metaNameMatcher(name), '');
  }
  html = html.replace(/<script\b(?=[^>]*\bid=["']leamjobs-job-posting-jsonld["'])[^>]*>[\s\S]*?<\/script>/gi, '');

  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) throw new Error('Vite HTML template is missing </head>.');
  html = `${html.slice(0, headEnd)}${metadataMarkup(pageMetadata)}\n${html.slice(headEnd)}`;

  const rootPattern = /<div\b(?=[^>]*\bid=["']root["'])[^>]*>[\s\S]*?<\/div>/i;
  if (!rootPattern.test(html)) throw new Error('Vite HTML template is missing the React root element.');
  html = html.replace(rootPattern, (root) => root.replace(/>[\s\S]*<\/div>$/i, `>${contentHtml}</div>`));

  if (structuredData) {
    const serialized = JSON.stringify(structuredData).replace(/[<>&]/g, (character) => ({
      '<': '\\u003c',
      '>': '\\u003e',
      '&': '\\u0026',
    })[character]);
    const safeJsonLd = `<script id="leamjobs-job-posting-jsonld" type="application/ld+json">${serialized}</script>`;
    const closingHead = html.indexOf('</head>');
    html = `${html.slice(0, closingHead)}${safeJsonLd}\n${html.slice(closingHead)}`;
  }
  return html;
};

const jobIsActive = (job, now) => !metadata.isJobApplicationDeadlineExpired(job, now);

const jobSummaryMarkup = (job) => {
  const title = typeof job.title === 'string' ? job.title.trim() : '';
  if (!title || typeof job.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(job.id)) return '';
  const company = typeof job.company?.name === 'string' && job.company.name.trim()
    ? job.company.name.trim()
    : 'Company not provided';
  const location = typeof job.location === 'string' && job.location.trim()
    ? job.location.trim()
    : 'Location not provided';
  const description = typeof job.description === 'string' ? job.description.trim() : '';
  const excerpt = description.length > 280 ? `${description.slice(0, 279).trimEnd()}…` : description;
  return `<li><h2><a href="/jobs/${encodeURIComponent(job.id)}/">${escapeHtml(title)}</a></h2><p>${escapeHtml(company)} · ${escapeHtml(location)}</p>${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}</li>`;
};

export const renderHomeContent = () => [
  '<main class="seo-prerender-content">',
  '<h1>Find jobs and career opportunities in Nigeria</h1>',
  '<p>Explore current job vacancies, discover roles by title or location, and connect with employers through LeamJobs.</p>',
  '<p><a href="/jobs/">Browse current jobs and vacancies</a></p>',
  '</main>',
].join('');

export const renderJobsContent = (jobs) => {
  const listings = jobs.slice(0, 25).map(jobSummaryMarkup).filter(Boolean);
  return [
    '<main class="seo-prerender-content">',
    '<header><h1>Find jobs and vacancies in Nigeria</h1><p>Browse currently approved opportunities from employers on LeamJobs. Listings are ordered by their published date.</p></header>',
    listings.length
      ? `<section aria-label="Current job vacancies"><ol>${listings.join('')}</ol></section>`
      : '<p>No current approved job vacancies are available right now. Please check back soon.</p>',
    '</main>',
  ].join('');
};

const renderJobContent = (job, structuredData) => {
  const jobTitle = typeof job.title === 'string' && job.title.trim() ? job.title.trim() : 'Job listing details';
  const title = escapeHtml(jobTitle);
  const companyName = typeof job.company?.name === 'string' && job.company.name.trim()
    ? job.company.name.trim()
    : 'Company not provided';
  const location = typeof job.location === 'string' && job.location.trim()
    ? job.location.trim()
    : 'Location not provided';
  const description = typeof job.description === 'string' ? job.description.trim() : '';
  const expired = metadata.isJobApplicationDeadlineExpired(job);
  const qualificationMessage = structuredData
    ? ''
    : '<p>This listing is available, but does not include enough verified information for an indexable job result.</p>';
  const deadline = typeof job.applicationDeadline === 'string' && !expired
    ? `<p><strong>Application deadline:</strong> <time datetime="${escapeHtml(job.applicationDeadline)}">${escapeHtml(new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(job.applicationDeadline)))}</time></p>`
    : '';

  return [
    '<main class="seo-prerender-content">',
    `<article><header><h1>${title}</h1><p>${escapeHtml(companyName)} · ${escapeHtml(location)}</p></header>`,
    expired ? '<p>This job listing has expired and is no longer accepting applications.</p>' : '',
    qualificationMessage,
    description ? `<section><h2>Job description</h2><p>${escapeHtml(description)}</p></section>` : '',
    `<section><h2>Job details</h2><p><strong>Work arrangement:</strong> ${escapeHtml(job.workArrangement || 'Not specified')}</p>${deadline}</section>`,
    '<p><a href="/jobs/">Browse current jobs in Nigeria</a></p></article>',
    '</main>',
  ].join('');
};

const fetchPublicJobs = async (apiBaseUrl, fetchImpl = fetch) => {
  const base = `${apiBaseUrl.replace(/\/+$/, '')}/`;
  let cursor = null;
  const jobs = [];
  const seenCursors = new Set();
  const seenJobIds = new Set();

  while (true) {
    const url = new URL('jobs', base);
    url.searchParams.set('limit', String(PAGE_SIZE));
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Public jobs API returned HTTP ${response.status} for ${url.pathname}.`);

    const payload = await response.json();
    if (payload?.success !== true || !Array.isArray(payload?.data?.jobs)) {
      throw new Error('Public jobs API returned an unexpected response shape.');
    }

    for (const job of payload.data.jobs) {
      if (typeof job?.id === 'string' && seenJobIds.has(job.id)) {
        throw new Error(`Public jobs API repeated job ID ${job.id} while paginating.`);
      }
      if (typeof job?.id === 'string') seenJobIds.add(job.id);
      jobs.push(job);
    }
    if (jobs.length > MAX_JOB_PAGES) {
      throw new Error(`Public job inventory exceeds the ${MAX_JOB_PAGES} page-generation safety limit.`);
    }

    const nextCursor = payload.data.nextCursor;
    if (nextCursor === null || nextCursor === undefined || nextCursor === '') return jobs;
    if (typeof nextCursor !== 'string' || seenCursors.has(nextCursor)) {
      throw new Error('Public jobs API returned an invalid or repeated pagination cursor.');
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }
};

export const generatePrerenderedPages = (template, jobs, now = new Date()) => {
  const generated = new Map();
  const homeMetadata = metadata.getPageMetadata('/');
  generated.set('index.html', renderSeoHtml(template, homeMetadata, renderHomeContent()));

  const activeJobs = jobs.filter((job) => jobIsActive(job, now));
  generated.set(
    'jobs/index.html',
    renderSeoHtml(template, metadata.getPageMetadata('/jobs/'), renderJobsContent(activeJobs)),
  );

  for (const job of activeJobs) {
    if (typeof job.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(job.id)) {
      throw new Error('Public jobs API returned a job with an invalid route ID.');
    }
    const routePath = `/jobs/${job.id}/`;
    const canonicalUrl = `${metadata.CANONICAL_SITE_ORIGIN}${routePath}`;
    const structuredData = metadata.getJobPostingStructuredData(job, canonicalUrl, now);
    const hasCompleteIndexableData = structuredData !== null;
    const pageMetadata = {
      ...metadata.getJobPageMetadata(job),
      canonicalUrl: hasCompleteIndexableData ? canonicalUrl : null,
      robots: hasCompleteIndexableData ? 'index,follow' : 'noindex,follow',
    };
    const routeFile = `jobs/${job.id}/index.html`;
    generated.set(routeFile, renderSeoHtml(template, pageMetadata, renderJobContent(job, structuredData), structuredData));
  }
  return generated;
};

export const runPrerender = async ({
  outputDir = outputDirectory,
  apiBaseUrl = process.env.LEAMJOBS_PUBLIC_API_BASE_URL || 'https://leamjobs.com/api',
  fetchImpl = fetch,
  now = new Date(),
} = {}) => {
  const template = await readFile(resolve(outputDir, 'index.html'), 'utf8');
  const jobs = await fetchPublicJobs(apiBaseUrl, fetchImpl);
  const generated = generatePrerenderedPages(template, jobs, now);

  for (const [relativePath, html] of generated) {
    const destination = resolve(outputDir, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, html, 'utf8');
  }

  console.log(`Prerendered homepage, Jobs page, and ${generated.size - 2} public job detail page(s).`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runPrerender();
}
