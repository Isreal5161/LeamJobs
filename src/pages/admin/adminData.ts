import { applicants, employerJobs } from '../employer/employerData';

export type ModerationStatus = 'Pending' | 'Approved' | 'Flagged' | 'Declined';

export const adminJobs = employerJobs.map((job, index) => ({
  id: job.id,
  title: job.title,
  employer: ['LeamJobs Studio', 'Nova Cloud', 'BrightPath Media'][index] ?? 'Verified employer',
  category: job.team,
  location: job.location,
  type: job.type,
  salary: job.salary,
  posted: job.posted,
  status: job.status === 'Draft' ? 'Pending' : 'Approved',
  applicants: job.applicants,
  views: job.views,
  income: index === 0 ? 420 : index === 1 ? 360 : 120,
  subscription: index === 0 ? 'Premium' : index === 1 ? 'Growth' : 'Free',
  featured: index === 0,
}));

export const adminSeekers = applicants.map((applicant, index) => ({
  id: applicant.id,
  name: applicant.name,
  role: applicant.role,
  email: `${applicant.id}@example.com`,
  applications: index === 0 ? 8 : index === 1 ? 6 : index + 2,
  interviews: index < 2 ? 3 : 1,
  savedJobs: index + 5,
  status: index === 4 ? 'Flagged' : 'Approved',
  joined: `Aug ${14 - index}, 2026`,
}));

export const adminEmployers = [
  {
    id: 'leamjobs-studio',
    name: 'LeamJobs Studio',
    email: 'hiring@leamjobs.com',
    postedJobs: 7,
    subscription: 'Premium',
    monthlyIncome: 420,
    status: 'Approved',
  },
  {
    id: 'nova-cloud',
    name: 'Nova Cloud',
    email: 'talent@novacloud.com',
    postedJobs: 4,
    subscription: 'Growth',
    monthlyIncome: 360,
    status: 'Pending',
  },
  {
    id: 'brightpath-media',
    name: 'BrightPath Media',
    email: 'team@brightpath.com',
    postedJobs: 2,
    subscription: 'Free',
    monthlyIncome: 0,
    status: 'Flagged',
  },
  {
    id: 'google',
    name: 'Google',
    email: 'careers@google.com',
    postedJobs: 1,
    subscription: 'Enterprise',
    monthlyIncome: 900,
    status: 'Approved',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    email: 'talent@amazon.com',
    postedJobs: 1,
    subscription: 'Enterprise',
    monthlyIncome: 900,
    status: 'Approved',
  },
  {
    id: 'figma',
    name: 'Figma',
    email: 'hiring@figma.com',
    postedJobs: 1,
    subscription: 'Growth',
    monthlyIncome: 360,
    status: 'Pending',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    email: 'talent@spotify.com',
    postedJobs: 1,
    subscription: 'Enterprise',
    monthlyIncome: 900,
    status: 'Approved',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    email: 'careers@microsoft.com',
    postedJobs: 1,
    subscription: 'Enterprise',
    monthlyIncome: 900,
    status: 'Approved',
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    email: 'jobs@airbnb.com',
    postedJobs: 1,
    subscription: 'Growth',
    monthlyIncome: 360,
    status: 'Approved',
  },
];

export const websitePages = [
  {
    id: 'welcome',
    page: 'Welcome page',
    section: 'Hero section',
    title: 'Find a job that actually fits you.',
    owner: 'Marketing',
    status: 'Published',
  },
  {
    id: 'companies',
    page: 'Companies page',
    section: 'Company directory',
    title: 'Companies on LeamJobs',
    owner: 'Partnerships',
    status: 'Review',
  },
  {
    id: 'features',
    page: 'Features page',
    section: 'Job seeker tools',
    title: 'Everything you need to find better work.',
    owner: 'Product',
    status: 'Published',
  },
  {
    id: 'how-it-works',
    page: 'How it works',
    section: 'Process content',
    title: 'A simpler way to move from search to hired.',
    owner: 'Product',
    status: 'Draft',
  },
];

export const jobFilters = ['Remote', 'Full-time', 'Design', 'New York', '$100k+', 'Engineering', 'Marketing'];
export const jobCategories = ['Design', 'Engineering', 'Marketing', 'Product', 'Sales'];
