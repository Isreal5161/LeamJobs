import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSeekerSubscriptionPlans, getSeekerSubscriptions } from '../services/api';

export type SubscriptionPlanId = 'free' | 'professional' | 'premium';
export type SubscriptionStatus = 'Pending' | 'Active' | 'Cancelled' | 'Expired' | 'Failed';

export const getAccountTypeLabel = (value?: string | null, fallback = 'Basic') => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized || normalized === 'basic' || normalized === 'free') return 'Basic';
  if (normalized === 'professional' || normalized === 'pro') return 'Professional';
  if (normalized === 'premium' || normalized === 'pre') return 'Premium';

  if (normalized.includes('professional')) return 'Professional';
  if (normalized.includes('premium')) return 'Premium';

  const fallbackLabel = String(fallback || 'Basic').trim();
  if (!fallbackLabel) return 'Basic';
  return fallbackLabel;
};

export const resolveAccountTypeForPlan = (value?: string | null, availablePlans: SubscriptionPlan[] = [], fallback = 'Basic') => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return getAccountTypeLabel(fallback, 'Basic');

  const planById = availablePlans.find((plan) => {
    const candidateIds = [plan.id, plan.name, plan.id ?? '', plan.name ?? ''];
    return candidateIds.some((candidate) => candidate && candidate.toString().trim().toLowerCase() === trimmed.toLowerCase());
  });

  if (planById) {
    return getAccountTypeLabel(planById.name, fallback);
  }

  return getAccountTypeLabel(trimmed, fallback);
};

export type SubscriptionPlan = {
  id: SubscriptionPlanId | string;
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
  planId: SubscriptionPlanId | string;
  status: SubscriptionStatus;
  startedAt: string;
  renewalDate: string;
  featured: boolean;
  advancedCvEligible: boolean;
  aiEntitlements: string[];
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
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(subscriptionPlans);
  const [subscriptions, setSubscriptions] = useState<SeekerSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useMemo(() => async () => {
    if (!token || !user || user.role !== 'SEEKER') {
      setPlans(subscriptionPlans);
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [plansResult, subscriptionsResult] = await Promise.all([
      getSeekerSubscriptionPlans(token),
      getSeekerSubscriptions(token),
    ]);

    if (plansResult.ok && plansResult.data?.data?.plans) {
      const nextPlans = plansResult.data.data.plans.map((plan) => ({
        id: plan.id,
        name: getAccountTypeLabel(plan.key, plan.displayName || 'Basic'),
        price: Number(plan.price ?? 0),
        visibilityBoost: 0,
        description: plan.description ?? 'Subscription plan',
        benefits: plan.benefits ?? [],
        featuredPriority: 0,
        featuredEligible: false,
      }));

      setPlans([
        {
          id: 'free',
          name: 'Basic',
          price: 0,
          visibilityBoost: 0,
          description: 'Standard profile visibility and job matching.',
          benefits: ['Standard recommendations', 'Public profile', 'Application tracking'],
          featuredPriority: 0,
          featuredEligible: false,
        },
        ...nextPlans.filter((plan) => plan.id !== 'free'),
      ]);
    }

    if (subscriptionsResult.ok && subscriptionsResult.data?.data) {
      const nextSubscriptions: SeekerSubscription[] = (subscriptionsResult.data.data.subscriptions ?? []).map((item) => {
        const aiEntitlements = Array.isArray(item.plan?.entitlements)
          ? (item.plan.entitlements as string[]).filter((key) => typeof key === 'string' && key.startsWith('AI_'))
          : [];

        return {
          seekerId: item.userId,
          seekerName: item.plan?.displayName ? item.plan.displayName : 'Seeker',
          email: user.email,
          planId: item.planId,
          status: item.status === 'ACTIVE'
            ? 'Active'
            : item.status === 'PENDING'
              ? 'Pending'
              : item.status === 'CANCELLED'
                ? 'Cancelled'
                : item.status === 'FAILED'
                  ? 'Failed'
                  : 'Expired',
          startedAt: item.startDate ?? 'Not started',
          renewalDate: item.nextRenewalAt ?? 'Not applicable',
          featured: false,
          advancedCvEligible: item.plan?.entitlements?.includes('ADVANCED_CV') ?? false,
          aiEntitlements,
        };
      });
      setSubscriptions(nextSubscriptions);
    } else {
      setSubscriptions([]);
    }

    setIsLoading(false);
  }, [token, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      advancedCvEligible: false,
      aiEntitlements: [],
    };

    const getVisibilityBoost = (seekerId: string) => {
      const subscription = getSubscription(seekerId);
      return subscription.status === 'Active' ? plans.find((plan) => plan.id === subscription.planId)?.visibilityBoost ?? 0 : 0;
    };

    const getRecommendationScore = (seekerId: string) => {
      const subscription = getSubscription(seekerId);
      const plan = plans.find((item) => item.id === subscription.planId) ?? plans[0];
      if (subscription.status !== 'Active') return 0;
      return (plan.visibilityBoost ?? 0) + (subscription.featured && plan.featuredEligible ? plan.featuredPriority : 0);
    };

    return {
      subscriptions,
      plans,
      getSubscription,
      getVisibilityBoost,
      getRecommendationScore,
      updateSubscription: () => undefined,
      updateSubscriptionStatus: () => undefined,
      toggleFeatured: () => undefined,
      updatePlan: () => undefined,
      isLoading,
      refresh,
    };
  }, [plans, subscriptions, isLoading, refresh]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscriptions must be used inside SubscriptionProvider');
  return context;
}
