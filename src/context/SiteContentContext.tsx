import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type SitePageKey = 'welcome' | 'about' | 'features' | 'how-it-works' | 'companies';

export type SiteStat = {
  value: string;
  label: string;
};

export type WelcomeContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  employerCta: string;
  stats: SiteStat[];
  filters: string[];
};

export type AboutContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  values: { title: string; text: string }[];
  stats: SiteStat[];
  team: string[];
};

export type FeatureItem = {
  title: string;
  text: string;
};

export type FeaturesContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  recommendations: { title: string; meta: string; match: string }[];
  profileCompletion: number;
  items: FeatureItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
};

export type HowItWorksContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  steps: { title: string; text: string }[];
  stats: SiteStat[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
};

export type CompaniesContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  filters: string[];
  companies: { name: string; category: string; location: string; employees: string; tone: string }[];
  stats: SiteStat[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
};

export type SiteContent = {
  welcome: WelcomeContent;
  about: AboutContent;
  features: FeaturesContent;
  'how-it-works': HowItWorksContent;
  companies: CompaniesContent;
};

export const initialSiteContent: SiteContent = {
  welcome: {
    heroTitle: 'Find a job that actually fits you.',
    heroSubtitle: 'Smart matching, better opportunities, and tools to help you grow your career.',
    primaryCta: 'Create free account',
    secondaryCta: 'Sign in',
    employerCta: 'Post a job',
    stats: [
      { value: '120k+', label: 'Open roles' },
      { value: '18k+', label: 'Companies' },
      { value: '2.4M', label: 'Hired members' },
    ],
    filters: ['Remote', 'Full-time', 'Design', 'New York', '$100k+', 'Engineering', 'Marketing'],
  },
  about: {
    eyebrow: 'About LeamJobs',
    title: 'About LeamJobs',
    description:
      "We're on a mission to connect great people with meaningful opportunities and help companies build teams that drive the future.",
    primaryCta: 'Create free account',
    secondaryCta: 'I already have one',
    values: [
      { title: 'People first', text: 'We put people at the center of everything we do.' },
      { title: 'Trust & transparency', text: 'Honest, open, and fair in every interaction.' },
      { title: 'Growth mindset', text: 'We learn, adapt, and keep improving together.' },
      { title: 'Impact', text: 'We build with purpose to create real, positive change.' },
    ],
    stats: [
      { value: '120k+', label: 'Open roles' },
      { value: '18k+', label: 'Companies' },
      { value: '2.4M', label: 'Hired members' },
      { value: '150+', label: 'Countries' },
    ],
    team: ['SA', 'JM', 'NK', 'AL', 'RP'],
  },
  features: {
    heroTitle: 'Features that make job search smarter',
    heroSubtitle:
      'LeamJobs gives you the tools and insights you need to find the right opportunities, faster and with confidence.',
    primaryCta: 'Create free account',
    secondaryCta: 'I already have one',
    recommendations: [
      { title: 'Senior Product Designer', meta: 'Google - New York, NY - Remote', match: '95% match' },
      { title: 'Product Design Lead', meta: 'Slack - San Francisco, CA - Hybrid', match: '89% match' },
      { title: 'Design Systems Manager', meta: 'Dropbox - Austin, TX - Remote', match: '82% match' },
    ],
    profileCompletion: 72,
    items: [
      {
        title: 'Smart matching',
        text: 'Our AI matches you with jobs that fit your skills, experience, and career goals.',
      },
      {
        title: 'Save jobs',
        text: 'Bookmark jobs you love and come back to them anytime.',
      },
      {
        title: 'Track applications',
        text: 'Keep track of every application and stay organized in one place.',
      },
      {
        title: 'Salary insights',
        text: 'See real salary ranges and compensation insights for better decisions.',
      },
      {
        title: 'Company reviews',
        text: 'Read real reviews from employees to learn about company culture.',
      },
      {
        title: 'Remote filters',
        text: 'Find remote and hybrid jobs that fit your lifestyle.',
      },
    ],
    ctaTitle: 'Everything you need to find your next great opportunity',
    ctaSubtitle: 'Join millions of professionals using LeamJobs to build their dream careers.',
    ctaButton: 'Create free account',
  },
  'how-it-works': {
    heroTitle: 'How LeamJobs works',
    heroSubtitle: 'Three simple steps to your next great opportunity.',
    primaryCta: 'Create free account',
    secondaryCta: 'I already have one',
    steps: [
      {
        title: 'Create your profile',
        text: "Tell us about your skills, experience, and what you're looking for. Our AI builds a smart profile in minutes.",
      },
      {
        title: 'Get matched instantly',
        text: 'Receive personalized job recommendations with a match score so you only see roles that truly fit.',
      },
      {
        title: 'Apply and get hired',
        text: 'Apply in one tap, track every application, and connect directly with hiring teams.',
      },
    ],
    stats: [
      { value: '120k+', label: 'Open roles' },
      { value: '18k+', label: 'Companies' },
      { value: '2.4M', label: 'Hired members' },
      { value: '150+', label: 'Countries' },
    ],
    ctaTitle: 'Ready to find your next role?',
    ctaSubtitle: 'Join millions of professionals using LeamJobs.',
    ctaButton: 'Create free account',
  },
  companies: {
    heroTitle: 'Companies on LeamJobs',
    heroSubtitle: 'Explore teams hiring right now-from early-stage startups to Fortune 500 leaders.',
    primaryCta: 'Create free account',
    secondaryCta: 'I already have one',
    filters: ['All', 'Startup', 'Enterprise', 'Remote-first', 'Fintech', 'Design', 'Product', 'Engineering'],
    companies: [
      { name: 'Google', category: 'Technology', location: 'Mountain View, CA', employees: '100k+ employees', tone: 'google' },
      { name: 'Slack', category: 'Software', location: 'San Francisco, CA', employees: '2k-5k employees', tone: 'slack' },
      { name: 'Dropbox', category: 'Cloud Storage', location: 'San Francisco, CA', employees: '2k-5k employees', tone: 'dropbox' },
      { name: 'Figma', category: 'Design', location: 'San Francisco, CA', employees: '1k-2k employees', tone: 'figma' },
      { name: 'Spotify', category: 'Audio', location: 'Stockholm, Sweden', employees: '5k+ employees', tone: 'spotify' },
      { name: 'Stripe', category: 'Fintech', location: 'Dublin, Ireland', employees: '4k+ employees', tone: 'stripe' },
      { name: 'Airbnb', category: 'Travel', location: 'San Francisco, CA', employees: '6k+ employees', tone: 'airbnb' },
      { name: 'Notion', category: 'Productivity', location: 'San Francisco, CA', employees: '1k+ employees', tone: 'notion' },
      { name: 'Amazon', category: 'Technology', location: 'Seattle, WA', employees: '1.5M+ employees', tone: 'amazon' },
      { name: 'Microsoft', category: 'Technology', location: 'Redmond, WA', employees: '220k+ employees', tone: 'microsoft' },
    ],
    stats: [
      { value: '120k+', label: 'Open roles' },
      { value: '18k+', label: 'Companies' },
      { value: '2.4M', label: 'Hired members' },
      { value: '150+', label: 'Countries' },
    ],
    ctaTitle: 'Hiring on LeamJobs?',
    ctaSubtitle: 'Reach millions of qualified candidates and find your next great hire.',
    ctaButton: 'Post a job',
  },
};

type SiteContentContextValue = {
  content: SiteContent;
  updatePage: <K extends SitePageKey>(pageKey: K, updater: (current: SiteContent[K]) => SiteContent[K]) => void;
  setPageField: <K extends SitePageKey>(pageKey: K, field: keyof SiteContent[K], value: SiteContent[K][keyof SiteContent[K]]) => void;
};

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(initialSiteContent);

  const value = useMemo<SiteContentContextValue>(() => ({
    content,
    updatePage: (pageKey, updater) => {
      setContent((current) => ({
        ...current,
        [pageKey]: updater(current[pageKey]),
      }));
    },
    setPageField: (pageKey, field, value) => {
      setContent((current) => ({
        ...current,
        [pageKey]: {
          ...current[pageKey],
          [field]: value,
        },
      }));
    },
  }), [content]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error('useSiteContent must be used inside SiteContentProvider');
  }

  return context;
}