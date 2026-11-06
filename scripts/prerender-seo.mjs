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

const publicPageContent = {
  '/about': [
    '<h1>About LeamJobs</h1>',
    '<section><h2>Our mission</h2><p>To create a smarter, more human way to find and fill jobs, empowering people to grow their careers and companies to build exceptional teams.</p></section>',
    '<p>LeamJobs brings job seekers and employers together through job discovery, career profiles, and hiring tools.</p>',
  ],
  '/contact': [
    '<h1>Contact LeamJobs</h1>',
    '<p>Questions about finding work, hiring, or using LeamJobs? Send our support team an email and we’ll be happy to help.</p>',
    '<p><a href="mailto:admin@leamjobs.com">Contact LeamJobs support</a></p>',
  ],
  '/cookies': [
    '<h1>Cookie Policy</h1>',
    '<p>This Cookie Policy describes the frontend storage and tracking behavior identified in the code review. It covers browser local storage and the third-party resource request reviewed for LeamJobs.</p>',
    '<section><h2>Cookies and browser storage are different</h2><p>The reviewed frontend stores the authentication token and cookie preferences in local storage. The preference record is not a cookie and does not contain passwords, identity documents or bank details. The public page loads a Font Awesome stylesheet from cdnjs; this resource request alone does not establish that the provider sets a cookie.</p></section>',
    '<section><h2>Strictly necessary</h2><p>Necessary browser storage supports core account and preference functionality and is not switchable off in the settings interface.</p></section>',
    '<section><h2>Analytics and marketing</h2><p>No active analytics tags, advertising tags or tracking pixels were found in the reviewed source. Analytics and marketing remain off unless a valid preference allows a relevant future integration.</p></section>',
    '<section><h2>Choosing and changing preferences</h2><p>The preference interface offers Accept all, Reject optional and Customize preferences. Analytics and marketing default to off; necessary is always on. Choices are stored in this browser’s local storage with a timestamp and policy version. Use Cookie settings to reopen settings, save custom choices or withdraw optional choices.</p></section>',
    '<section><h2>Current inventory and updates</h2><p>The reviewed inventory includes local-storage use for authentication and cookie preferences and the Font Awesome CSS request. No analytics or advertising cookie provider is currently confirmed. The Company should keep this inventory current as production cookies, SDKs, embedded content, server-side tracking and consent expiration change.</p></section>',
  ],
  '/payment-policy': [
    '<h1>Payment, Refund and Escrow Policy</h1>',
    '<p>This Policy explains payment, contract funding, escrow status, fees, refunds, disputes, withdrawals and payouts on LEAMJobs. Review the transaction screen and applicable provider terms before paying.</p>',
    '<section><h2>1. Payment features and availability</h2><p>The backend includes subscription checkout, contract-funding, wallet/ledger, withdrawal and payout flows. New freelance funding, escrow release and withdrawals are feature-gated and may be unavailable. Currency and provider support depend on current configuration; do not assume any feature or currency is active for your account. The code includes Paystack collection for NGN contract funding when the feature is enabled and fully configured, and Flutterwave payment initialization and verification. Enabled providers, supported transaction types and checkout terms depend on current configuration.</p></section>',
    '<section><h2>2. Contract funding and escrow status</h2><p>For supported contracts, the platform validates the contract, currency, amount and saved fee and entitlement values, initializes payment with a supported provider, and verifies provider transactions before marking the related escrow funded. Payment and escrow states are tracked in the platform with ledger records for financial history. The presence of an escrow record or a platform status does not establish that funds are held in a legally protected trust or by an independent escrow agent, or establish who legally holds funds, the safeguarding arrangements, release conditions, insolvency treatment or any guarantee. No guaranteed recovery or outcome is promised.</p></section>',
    '<section><h2>3. Fees, currencies and checkout</h2><p>Contract fee and payout values are stored with contract and funding records. Withdrawal fees are supplied through a configured fee schedule and shown in a quote before confirmation. Actual fees, taxes, supported currencies, conversion and provider charges depend on the transaction screen, account eligibility and current configuration. Confirm the full amount and currency before authorizing payment.</p><p>A redirect back from a payment provider is not by itself proof of settlement. Provider verification and webhook or reconciliation flows update payment status. Do not treat a pending or failed status as a completed payment.</p></section>',
    '<section><h2>4. Refunds, cancellations and disputes</h2><p>This Policy does not state a general automatic refund entitlement, refund timeline or universal cancellation right. Whether funds can be returned depends on provider settlement, contract status, transaction history, applicable law and the outcome of any supported dispute process. Do not assume that a payment can be reversed or that a refund is guaranteed. Eligibility, evidence requirements, decision-maker, response timelines and refund outcomes depend on applicable contract terms and the supported dispute process. For questions, use the <a href="/contact">Contact page</a>.</p></section>',
    '<section><h2>5. Withdrawals and payouts</h2><p>The backend creates a withdrawal quote tied to the account, amount, currency, payout account and current fee configuration. A confirmed request reserves funds in the pending-withdrawal balance and may proceed to provider execution; withdrawals are subject to feature availability, verification, supported payout countries/currencies and provider review. The system does not establish a guaranteed processing time. Failed transfers, payout fees, bank processing, intermediary charges and return handling depend on provider and banking rules. Check the quote and status information displayed for your transaction.</p></section>',
    '<section><h2>6. Contact</h2><p>Use the <a href="/contact">Contact page</a> for transaction questions about refunds, cancellations, disputes, fees, providers, currencies, custody, payout timing or support.</p></section>',
  ],
  '/features': [
    '<h1>Features that make job search smarter</h1>',
    '<p>Explore tools for discovering job opportunities, saving roles, and keeping track of applications, alongside features that help employers hire.</p>',
    '<ul><li>Discover job opportunities</li><li>Save jobs for later</li><li>Track applications</li><li>Explore employer and company profiles</li></ul>',
  ],
  '/how-it-works': [
    '<h1>How LeamJobs works</h1>',
    '<p>Use LeamJobs to create a profile, explore job opportunities, and apply to roles that match your interests.</p>',
    '<ol><li>Create your profile</li><li>Explore available jobs</li><li>Apply and track your applications</li></ol>',
    '<p><a href="/jobs/">Browse current jobs in Nigeria</a></p>',
  ],
  '/companies': [
    '<h1>Companies on LeamJobs</h1>',
    '<p>Explore employer profiles to learn about companies and find their approved job opportunities on LeamJobs.</p>',
    '<p>Company details and available jobs are shown on each public company profile.</p>',
  ],
};

const renderPublicPageContent = (pathname) => {
  const sections = publicPageContent[pathname];
  if (!sections) throw new Error(`Missing prerender content for public route ${pathname}.`);
  return `<main class="seo-prerender-content">${sections.join('')}</main>`;
};

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
  const activeJobs = jobs.filter((job) => jobIsActive(job, now));
  for (const pathname of metadata.getIndexablePublicPaths()) {
    const relativePath = pathname === '/' ? 'index.html' : `${pathname.slice(1)}/index.html`;
    const content = pathname === '/'
      ? renderHomeContent()
      : pathname === '/jobs'
        ? renderJobsContent(activeJobs)
        : renderPublicPageContent(pathname);
    generated.set(relativePath, renderSeoHtml(template, metadata.getPageMetadata(pathname), content));
  }

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
  const staticPageCount = metadata.getIndexablePublicPaths().length;

  for (const [relativePath, html] of generated) {
    const destination = resolve(outputDir, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, html, 'utf8');
  }

  console.log(`Prerendered ${staticPageCount} indexable public page(s) and ${generated.size - staticPageCount} public job detail page(s).`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runPrerender();
}
