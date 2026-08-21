export type ModerationStatus = 'Pending' | 'Approved' | 'Flagged' | 'Declined';

export type JobDetails = {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  company: string;
};

export type PublicJob = {
  id: string;
  company: string;
  logoText: string;
  logoClass?: string;
  featured?: boolean;
  role: string;
  salary: string;
  compensationType?: 'Monthly salary' | 'One-time payment';
  paymentAmount?: number;
  location: string;
  workArrangement: string;
  workType: string;
  level: string;
  description: string;
  postedAt: number;
  salaryHigh: number;
  applicants: number;
  views: number;
  conversion: string;
  expires: string;
  status: ModerationStatus;
  details: JobDetails;
};

const fallbackDetails = (company: string): JobDetails => ({
  overview:
    'Join a high-impact team building thoughtful digital products for people and businesses. This role blends strategy, craft, collaboration, and measurable product outcomes.',
  responsibilities: [
    'Own work from discovery through launch.',
    'Partner with product, engineering, and business teams.',
    'Translate user and market insights into clear execution.',
    'Improve quality through feedback and iteration.',
  ],
  requirements: [
    '3+ years of relevant professional experience.',
    'Portfolio or work history with strong practical outcomes.',
    'Comfort working in modern collaborative tools.',
    'Clear communication and strong ownership.',
  ],
  skills: ['Product Thinking', 'Research', 'Collaboration', 'Systems'],
  company: `${company} builds products for modern teams and invests in thoughtful candidate experiences.`,
});

export const initialJobs: PublicJob[] = [
  {
    id: 'google',
    company: 'Google',
    logoText: 'G',
    logoClass: 'brand-logo--google',
    featured: true,
    role: 'Senior Product Designer',
    salary: '$150k - $190k',
    compensationType: 'One-time payment',
    paymentAmount: 1800,
    location: 'New York, NY',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Design delightful products used by billions worldwide.',
    postedAt: 6,
    salaryHigh: 190,
    applicants: 84,
    views: 1240,
    conversion: '6.8%',
    expires: 'Sep 12, 2026',
    status: 'Approved',
    details: {
      overview:
        'Design delightful products used by billions of people worldwide. You will work with cross-functional teams to solve complex problems and create intuitive experiences that make a real impact.',
      responsibilities: [
        'Lead end-to-end design for key product initiatives.',
        'Collaborate with PMs, engineers, and researchers.',
        'Create user-centered designs and interactive prototypes.',
        'Advocate for users and influence product strategy.',
      ],
      requirements: [
        '5+ years of experience in product or UX design.',
        'Strong portfolio showcasing complex product design.',
        'Expert in Figma and modern design tools.',
        'Excellent communication and collaboration skills.',
      ],
      skills: ['Figma', 'Prototyping', 'UX Research', 'Wireframing', 'Design Systems'],
      company:
        "Google's mission is to organize the world's information and make it universally accessible and useful.",
    },
  },
  {
    id: 'amazon',
    company: 'Amazon',
    logoText: 'a',
    logoClass: 'brand-logo--amazon',
    role: 'Senior UI/UX Designer',
    salary: '$130k - $160k',
    compensationType: 'One-time payment',
    paymentAmount: 1450,
    location: 'Seattle, WA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Craft user experiences that make a global impact.',
    postedAt: 5,
    salaryHigh: 160,
    applicants: 52,
    views: 960,
    conversion: '5.4%',
    expires: 'Sep 10, 2026',
    status: 'Approved',
    details: fallbackDetails('Amazon'),
  },
  {
    id: 'figma',
    company: 'Figma',
    logoText: 'F',
    logoClass: 'brand-logo--figma',
    role: 'Product Designer',
    salary: '$120k - $150k',
    location: 'San Francisco, CA',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Empower teams to build better products together.',
    postedAt: 4,
    salaryHigh: 150,
    applicants: 39,
    views: 720,
    conversion: '5.2%',
    expires: 'Sep 9, 2026',
    status: 'Pending',
    details: fallbackDetails('Figma'),
  },
  {
    id: 'spotify',
    company: 'Spotify',
    logoText: 'S',
    logoClass: 'brand-logo--spotify',
    role: 'Senior Product Designer',
    salary: '$140k - $180k',
    compensationType: 'One-time payment',
    paymentAmount: 1600,
    location: 'Stockholm, Sweden',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Create intuitive experiences for millions of listeners.',
    postedAt: 3,
    salaryHigh: 180,
    applicants: 48,
    views: 840,
    conversion: '5.7%',
    expires: 'Sep 8, 2026',
    status: 'Approved',
    details: fallbackDetails('Spotify'),
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    logoText: 'M',
    logoClass: 'brand-logo--microsoft',
    role: 'UX Designer',
    salary: '$125k - $155k',
    compensationType: 'One-time payment',
    paymentAmount: 1500,
    location: 'Redmond, WA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Design accessible experiences for users around the world.',
    postedAt: 2,
    salaryHigh: 155,
    applicants: 44,
    views: 810,
    conversion: '5.4%',
    expires: 'Sep 7, 2026',
    status: 'Approved',
    details: fallbackDetails('Microsoft'),
  },
  {
    id: 'airbnb',
    company: 'Airbnb',
    logoText: 'A',
    logoClass: 'brand-logo--airbnb',
    role: 'Product Designer',
    salary: '$135k - $175k',
    location: 'San Francisco, CA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Create meaningful experiences for travelers and hosts.',
    postedAt: 1,
    salaryHigh: 175,
    applicants: 61,
    views: 1050,
    conversion: '5.8%',
    expires: 'Sep 6, 2026',
    status: 'Approved',
    details: fallbackDetails('Airbnb'),
  },
  {
    id: 'slack',
    company: 'Slack',
    logoText: 'S',
    logoClass: 'brand-logo--slack',
    role: 'Product Designer',
    salary: '$125k - $155k',
    location: 'San Francisco, CA',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Design collaborative workflows for modern teams.',
    postedAt: 4,
    salaryHigh: 155,
    applicants: 34,
    views: 650,
    conversion: '5.2%',
    expires: 'Sep 11, 2026',
    status: 'Approved',
    details: fallbackDetails('Slack'),
  },
  {
    id: 'dropbox',
    company: 'Dropbox',
    logoText: 'D',
    logoClass: 'brand-logo--dropbox',
    role: 'UX Designer',
    salary: '$118k - $148k',
    location: 'San Francisco, CA',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Mid-level',
    description: 'Shape simple file and collaboration experiences.',
    postedAt: 3,
    salaryHigh: 148,
    applicants: 28,
    views: 590,
    conversion: '4.7%',
    expires: 'Sep 5, 2026',
    status: 'Flagged',
    details: fallbackDetails('Dropbox'),
  },
  {
    id: 'stripe',
    company: 'Stripe',
    logoText: 'S',
    logoClass: 'brand-logo--stripe',
    role: 'Product Designer',
    salary: '$145k - $185k',
    location: 'Dublin, Ireland',
    workArrangement: 'Hybrid',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Design financial tools for ambitious internet businesses.',
    postedAt: 2,
    salaryHigh: 185,
    applicants: 57,
    views: 990,
    conversion: '5.8%',
    expires: 'Sep 4, 2026',
    status: 'Approved',
    details: fallbackDetails('Stripe'),
  },
  {
    id: 'notion',
    company: 'Notion',
    logoText: 'N',
    logoClass: 'brand-logo--notion',
    role: 'Design Systems Designer',
    salary: '$130k - $165k',
    location: 'San Francisco, CA',
    workArrangement: 'Remote',
    workType: 'Full-time',
    level: 'Senior-level',
    description: 'Build flexible design systems for connected workspaces.',
    postedAt: 1,
    salaryHigh: 165,
    applicants: 43,
    views: 770,
    conversion: '5.6%',
    expires: 'Sep 3, 2026',
    status: 'Approved',
    details: fallbackDetails('Notion'),
  },
];
