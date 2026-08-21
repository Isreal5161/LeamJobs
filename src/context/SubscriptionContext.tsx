import { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from 'react';

export type SubscriptionPlanId = 'free' | 'professional' | 'premium';
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Expired';

const STORAGE_KEY = 'job-portal-subscription-data';

const loadStoredState = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  visibilityBoost: number;
  description: string;
  benefits: string[];
  featuredPriority: number;
  featuredEligible: boolean;
};

export type SeekerSubscription = {
  seekerId: string;
  seekerName: string;
  email: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: string;
  renewalDate: string;
  featured: boolean;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    visibilityBoost: 0,
    description: 'Standard profile visibility and job matching.',
    benefits: ['Standard recommendations', 'Public profile', 'Application tracking'],
    featuredPriority: 0,
    featuredEligible: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 12,
    visibilityBoost: 8,
    description: 'More visibility when your skills match a role.',
    benefits: ['Priority recommendations', 'Professional badge', 'Profile visibility boost'],
    featuredPriority: 10,
    featuredEligible: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 24,
    visibilityBoost: 15,
    description: 'Maximum relevant visibility for active job seekers.',
    benefits: ['Highest recommendation priority', 'Premium badge', 'Featured candidate placement'],
    featuredPriority: 20,
    featuredEligible: true,
  },
];

const initialSubscriptions: SeekerSubscription[] = [
  {
    seekerId: 'sarah-johnson',
    seekerName: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    planId: 'professional',
    status: 'Active',
    startedAt: 'Aug 1, 2026',
    renewalDate: 'Sep 1, 2026',
    featured: true,
  },
  {
    seekerId: 'michael-chen',
    seekerName: 'Michael Chen',
    email: 'michael.chen@example.com',
    planId: 'free',
    status: 'Active',
    startedAt: 'Aug 12, 2026',
    renewalDate: 'Not applicable',
    featured: false,
  },
  {
    seekerId: 'amina-bello',
    seekerName: 'Amina Bello',
    email: 'amina.bello@example.com',
    planId: 'premium',
    status: 'Active',
    startedAt: 'Jul 20, 2026',
    renewalDate: 'Aug 20, 2026',
    featured: true,
  },
  {
    seekerId: 'daniel-ross',
    seekerName: 'Daniel Ross',
    email: 'daniel.ross@example.com',
    planId: 'free',
    status: 'Active',
    startedAt: 'Aug 9, 2026',
    renewalDate: 'Not applicable',
    featured: false,
  },
];

type SubscriptionContextValue = {
  subscriptions: SeekerSubscription[];
  plans: SubscriptionPlan[];
  updateSubscription: (seekerId: string, planId: SubscriptionPlanId) => void;
  updateSubscriptionStatus: (seekerId: string, status: SubscriptionStatus) => void;
  toggleFeatured: (seekerId: string) => void;
  updatePlan: (planId: SubscriptionPlanId, updates: Partial<Pick<SubscriptionPlan, 'name' | 'description' | 'benefits' | 'price' | 'visibilityBoost' | 'featuredPriority' | 'featuredEligible'>>) => void;
  getSubscription: (seekerId: string) => SeekerSubscription;
  getVisibilityBoost: (seekerId: string) => number;
  getRecommendationScore: (seekerId: string) => number;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const storedState = useMemo(() => loadStoredState(), []);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(storedState?.plans ?? subscriptionPlans);
  const [subscriptions, setSubscriptions] = useState<SeekerSubscription[]>(storedState?.subscriptions ?? initialSubscriptions);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ plans, subscriptions }));
    }
  }, [plans, subscriptions]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const getSubscription = (seekerId: string) => subscriptions.find((subscription) => subscription.seekerId === seekerId) ?? {
      seekerId,
      seekerName: seekerId,
      email: `${seekerId}@example.com`,
      planId: 'free',
      status: 'Active',
      startedAt: 'Not started',
      renewalDate: 'Not applicable',
      featured: false,
    };

    const getVisibilityBoost = (seekerId: string) => {
      const subscription = getSubscription(seekerId);
      return subscription.status === 'Active' ? plans.find((plan) => plan.id === subscription.planId)?.visibilityBoost ?? 0 : 0;
    };

    const getRecommendationScore = (seekerId: string) => {
      const subscription = getSubscription(seekerId);
      const plan = plans.find((item) => item.id === subscription.planId) ?? plans[0];

      if (subscription.status !== 'Active') {
        return 0;
      }

      return (plan.visibilityBoost ?? 0) + (subscription.featured && plan.featuredEligible ? plan.featuredPriority : 0);
    };

    return {
      subscriptions,
      plans,
      getSubscription,
      getVisibilityBoost,
      getRecommendationScore,
      updateSubscription: (seekerId, planId) => setSubscriptions((current) => current.map((subscription) => subscription.seekerId === seekerId ? {
        ...subscription,
        planId,
        status: planId === 'free' ? 'Cancelled' : 'Active',
        renewalDate: planId === 'free' ? 'Not applicable' : 'Sep 21, 2026',
        featured: planId === 'free' ? false : subscription.featured,
      } : subscription)),
      updateSubscriptionStatus: (seekerId, status) => setSubscriptions((current) => current.map((subscription) => {
        if (subscription.seekerId !== seekerId) {
          return subscription;
        }

        const shouldKeepFeatured = status === 'Active' && subscription.planId !== 'free';
        return {
          ...subscription,
          status,
          featured: shouldKeepFeatured ? subscription.featured : false,
        };
      })),
      toggleFeatured: (seekerId) => setSubscriptions((current) => current.map((subscription) => {
        if (subscription.seekerId !== seekerId) {
          return subscription;
        }

        const plan = plans.find((item) => item.id === subscription.planId) ?? plans[0];
        const nextFeatured = !(subscription.featured && plan.featuredEligible) ? plan.featuredEligible && subscription.status === 'Active' : false;

        return {
          ...subscription,
          featured: nextFeatured,
        };
      })),
      updatePlan: (planId, updates) => setPlans((current) => current.map((plan) => plan.id === planId ? { ...plan, ...updates } : plan)),
    };
  }, [plans, subscriptions]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscriptions must be used inside SubscriptionProvider');
  return context;
}
