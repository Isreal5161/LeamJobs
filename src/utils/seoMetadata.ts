import type { SeekerDashboardJob } from '../services/api';

export const CANONICAL_SITE_ORIGIN = 'https://leamjobs.com';

export type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string | null;
  robots: 'index,follow' | 'noindex,follow';
};

const siteDescription = 'Find jobs and career opportunities in Nigeria with LeamJobs. Explore verified vacancies, compare roles, and connect with employers.';
const jobsDescription = 'Search approved jobs and vacancies across Nigeria on LeamJobs. Explore real opportunities by title, skills, and location.';

const publicRouteMetadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'LeamJobs | Find Jobs and Career Opportunities in Nigeria',
    description: siteDescription,
  },
  '/about': {
    title: 'About LeamJobs | Connecting Talent and Employers',
    description: 'Learn about LeamJobs and our mission to connect job seekers and employers with better career and hiring opportunities.',
  },
  '/contact': {
    title: 'Contact LeamJobs | Job Search and Hiring Support',
    description: 'Contact LeamJobs support for help with finding work, hiring, or using the platform.',
  },
  '/features': {
    title: 'LeamJobs Features | Tools for Job Seekers and Employers',
    description: 'Explore LeamJobs tools for job discovery, career development, candidate matching, and hiring.',
  },
  '/how-it-works': {
    title: 'How LeamJobs Works | Find and Apply for Jobs',
    description: 'See how LeamJobs helps job seekers build a profile, discover opportunities, and apply to jobs.',
  },
  '/companies': {
    title: 'Companies Hiring on LeamJobs | Explore Employers',
    description: 'Explore company profiles and employers on LeamJobs to learn about teams and their job opportunities.',
  },
  '/jobs': {
    title: 'Jobs in Nigeria | Find Vacancies and Career Opportunities | LeamJobs',
    description: jobsDescription,
  },
};

const normalizePathname = (pathname: string) => {
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/+$/, '');
};

export const getPageMetadata = (pathname: string): PageMetadata => {
  const path = normalizePathname(pathname);
  const isJobDetail = /^\/jobs\/[^/]+$/.test(path);
  const isCompanyProfile = /^\/companies\/[^/]+$/.test(path);
  const metadata = publicRouteMetadata[path]
    ?? (isJobDetail
      ? { title: 'Job opportunity | LeamJobs', description: jobsDescription }
      : isCompanyProfile
        ? { title: 'Company Profile | LeamJobs', description: 'Explore this employer’s company profile and approved job opportunities on LeamJobs.' }
        : null);

  if (!metadata) {
    return {
      title: 'LeamJobs | Find Jobs and Career Opportunities in Nigeria',
      description: siteDescription,
      canonicalUrl: null,
      robots: 'noindex,follow',
    };
  }

  return {
    ...metadata,
    canonicalUrl: `${CANONICAL_SITE_ORIGIN}${path === '/jobs' || isJobDetail ? `${path}/` : path}`,
    robots: 'index,follow',
  };
};

const cleanText = (value: string | null | undefined) => (value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const truncateDescription = (value: string, maxLength = 160) => {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const excerpt = text.slice(0, maxLength - 1);
  const lastSpace = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, lastSpace > maxLength * 0.6 ? lastSpace : excerpt.length).trimEnd()}…`;
};

export const getJobPageMetadata = (job: SeekerDashboardJob) => {
  const title = cleanText(job.title) || 'Job opportunity';
  const company = cleanText(job.company?.name);
  const location = cleanText(job.location);
  const titleDetails = [title, company ? `at ${company}` : '', location ? `in ${location}` : ''].filter(Boolean).join(' ');
  const descriptionParts = [
    `${title}${company ? ` at ${company}` : ''}${location ? ` in ${location}` : ''}.`,
    cleanText(job.description),
  ].filter(Boolean);

  return {
    title: `${truncateDescription(titleDetails, 64)} | LeamJobs`,
    description: truncateDescription(descriptionParts.join(' ')) || jobsDescription,
  };
};

const isValidDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isJobApplicationDeadlineExpired = (job: SeekerDashboardJob, now = new Date()) => {
  const deadline = isValidDate(job.applicationDeadline);
  return deadline !== null && deadline.getTime() <= now.getTime();
};

const getJobSalary = (job: SeekerDashboardJob) => {
  const compensation = job.compensation;
  if (!compensation || !/^[A-Z]{3}$/.test(compensation.currency)) return null;

  if (compensation.type === 'EMPLOYMENT') {
    const minimum = compensation.salaryMin === null ? null : Number(compensation.salaryMin);
    const maximum = compensation.salaryMax === null ? null : Number(compensation.salaryMax);
    if ((minimum !== null && (!Number.isFinite(minimum) || minimum < 0))
      || (maximum !== null && (!Number.isFinite(maximum) || maximum < 0))
      || (minimum !== null && maximum !== null && maximum < minimum)) return null;
    if (minimum === null && maximum === null) return null;

    const value = minimum !== null && maximum !== null
      ? { minValue: minimum, maxValue: maximum }
      : { value: minimum ?? maximum };
    const unitText: Record<string, string> = {
      HOURLY: 'HOUR',
      DAILY: 'DAY',
      WEEKLY: 'WEEK',
      MONTHLY: 'MONTH',
      YEARLY: 'YEAR',
    };

    return {
      '@type': 'MonetaryAmount',
      currency: compensation.currency,
      value: {
        '@type': 'QuantitativeValue',
        ...value,
        ...(unitText[compensation.salaryPeriod] ? { unitText: unitText[compensation.salaryPeriod] } : {}),
      },
    };
  }

  const amount = Number(compensation.type === 'CONTRACT' ? compensation.amount : compensation.projectAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return {
    '@type': 'MonetaryAmount',
    currency: compensation.currency,
    value: {
      '@type': 'QuantitativeValue',
      value: amount,
      ...(compensation.type === 'FREELANCE' ? { unitText: 'PROJECT' } : {}),
    },
  };
};

export const getJobPostingStructuredData = (job: SeekerDashboardJob, canonicalUrl: string, now = new Date()) => {
  const title = cleanText(job.title);
  const description = cleanText(job.description);
  const companyName = cleanText(job.company?.name);
  const location = cleanText(job.location);
  const datePosted = isValidDate(job.createdAt);
  const deadline = isValidDate(job.applicationDeadline);

  if (!title || !description || !companyName || !location || !datePosted
    || datePosted.getTime() > now.getTime()
    || (job.applicationDeadline && !deadline)) return null;
  if (isJobApplicationDeadlineExpired(job, now)) return null;

  const employmentType = job.engagementType === 'CONTRACT' || job.engagementType === 'FREELANCE'
    ? 'CONTRACTOR'
    : null;
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted: datePosted.toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
      },
    },
    url: canonicalUrl,
  };

  if (deadline) structuredData.validThrough = deadline.toISOString();
  if (employmentType) structuredData.employmentType = employmentType;
  const salary = getJobSalary(job);
  if (salary) structuredData.baseSalary = salary;

  return structuredData;
};

const setHeadElement = <T extends HTMLElement>(selector: string, create: () => T, parent: HTMLElement = document.head): T => {
  const matches = Array.from(document.head.querySelectorAll<T>(selector));
  const element = matches.shift() ?? create();
  matches.forEach((duplicate) => duplicate.remove());
  if (!element.isConnected) parent.append(element);
  return element;
};

export const applyPageMetadata = (metadata: PageMetadata | ReturnType<typeof getJobPageMetadata>) => {
  document.title = metadata.title;

  const description = setHeadElement('meta[name="description"]', () => {
    const element = document.createElement('meta');
    element.name = 'description';
    return element;
  });
  description.content = metadata.description;

  const openGraphTitle = setHeadElement('meta[property="og:title"]', () => {
    const element = document.createElement('meta');
    element.setAttribute('property', 'og:title');
    return element;
  });
  openGraphTitle.content = metadata.title;

  const openGraphDescription = setHeadElement('meta[property="og:description"]', () => {
    const element = document.createElement('meta');
    element.setAttribute('property', 'og:description');
    return element;
  });
  openGraphDescription.content = metadata.description;

  const openGraphType = setHeadElement('meta[property="og:type"]', () => {
    const element = document.createElement('meta');
    element.setAttribute('property', 'og:type');
    return element;
  });
  openGraphType.content = 'website';

  const twitterCard = setHeadElement('meta[name="twitter:card"]', () => {
    const element = document.createElement('meta');
    element.name = 'twitter:card';
    return element;
  });
  twitterCard.content = 'summary';

  const twitterTitle = setHeadElement('meta[name="twitter:title"]', () => {
    const element = document.createElement('meta');
    element.name = 'twitter:title';
    return element;
  });
  twitterTitle.content = metadata.title;

  const twitterDescription = setHeadElement('meta[name="twitter:description"]', () => {
    const element = document.createElement('meta');
    element.name = 'twitter:description';
    return element;
  });
  twitterDescription.content = metadata.description;

  const robots = setHeadElement('meta[name="robots"]', () => {
    const element = document.createElement('meta');
    element.name = 'robots';
    return element;
  });
  robots.content = 'robots' in metadata ? metadata.robots : 'index,follow';

  if ('canonicalUrl' in metadata) {
    if (metadata.canonicalUrl) {
      const canonical = setHeadElement('link[rel="canonical"]', () => {
        const element = document.createElement('link');
        element.rel = 'canonical';
        return element;
      });
      canonical.href = metadata.canonicalUrl;
      const openGraphUrl = setHeadElement('meta[property="og:url"]', () => {
        const element = document.createElement('meta');
        element.setAttribute('property', 'og:url');
        return element;
      });
      openGraphUrl.content = metadata.canonicalUrl;
    } else {
      document.head.querySelectorAll('link[rel="canonical"]').forEach((canonical) => canonical.remove());
      document.head.querySelectorAll('meta[property="og:url"]').forEach((element) => element.remove());
    }
  }
};

export const applyJobPostingStructuredData = (job: SeekerDashboardJob | null, canonicalUrl: string | null) => {
  const scriptId = 'leamjobs-job-posting-jsonld';
  const existing = document.getElementById(scriptId);
  if (!job || !canonicalUrl) {
    existing?.remove();
    return;
  }

  const data = getJobPostingStructuredData(job, canonicalUrl);
  if (!data) {
    existing?.remove();
    return;
  }

  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
  if (!script.isConnected) document.head.append(script);
};
