import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSeekerSubscriptionPlans, getSeekerSubscriptions, getSeekerTrialOffer, type SeekerSubscriptionState, type SeekerTrialOffer } from '../services/api';

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
  key?: string;
  name: string;
  price: number;
  visibilityBoost: number;
  description: string;
  benefits: string[];
  featuredPriority: number;
  featuredEligible: boolean;
  aiAllowance?: number | null;
  aiUnlimited?: boolean;
  entitlements?: string[];
  featureConfig?: Record<string, unknown>;
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
  aiAllowance?: number | null;
  aiUnlimited?: boolean;
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
  currentPlan: SubscriptionPlan;
  trial: SeekerSubscriptionState['activeTrial'];
  trialOffer: SeekerTrialOffer;
  aiUsage: SeekerSubscriptionState['aiUsage'];
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(subscriptionPlans);
  const [subscriptions, setSubscriptions] = useState<SeekerSubscription[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(subscriptionPlans[0]);
  const [trial, setTrial] = useState<SeekerSubscriptionState['activeTrial']>(null);
  const [trialOffer, setTrialOffer] = useState<SeekerTrialOffer>({ available: false, durationDays: 7, trialPlanKey: 'PREMIUM' });
  const [aiUsage, setAiUsage] = useState<SeekerSubscriptionState['aiUsage']>({ userId: '', planKey: 'BASIC', source: 'FREE', limit: 5, used: 0, remaining: 5, allowed: true, unlimited: false });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useMemo(() => async () => {
    if (!token || !user || user.role !== 'SEEKER') {
      setPlans(subscriptionPlans);
      setSubscriptions([]);
      setCurrentPlan(subscriptionPlans[0]);
      setTrial(null);
      setTrialOffer({ available: false, durationDays: 7, trialPlanKey: 'PREMIUM' });
      setAiUsage({ userId: '', planKey: 'BASIC', source: 'FREE', limit: 5, used: 0, remaining: 5, allowed: true, unlimited: false });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [plansResult, subscriptionsResult, trialOfferResult] = await Promise.all([
      getSeekerSubscriptionPlans(token),
      getSeekerSubscriptions(token),
      getSeekerTrialOffer(token),
    ]);

    if (trialOfferResult.ok && trialOfferResult.data?.data?.offer) setTrialOffer(trialOfferResult.data.data.offer);

    if (plansResult.ok && plansResult.data?.data?.plans) {
      const nextPlans = plansResult.data.data.plans.map((plan) => ({
        id: plan.id,
        name: getAccountTypeLabel(plan.key, plan.displayName || 'Basic'),
        price: Number(plan.price ?? 0),
        visibilityBoost: 0,
        description: plan.description ?? 'Subscription plan',
        benefits: plan.benefits ?? [],
        key: plan.key,
        aiAllowance: plan.aiAllowance ?? null,
        aiUnlimited: plan.aiUnlimited ?? false,
        entitlements: plan.entitlements ?? [],
        featureConfig: plan.featureConfig ?? {},
        featuredPriority: 0,
        featuredEligible: false,
      }));

      const basicPlan = {
        id: 'free' as const,
        key: 'BASIC',
        name: 'Basic',
        price: 0,
        visibilityBoost: 0,
        description: 'Standard profile visibility and job matching.',
        benefits: ['Standard recommendations', 'Public profile', 'Application tracking'],
        featuredPriority: 0,
        featuredEligible: false,
        aiAllowance: 5,
        entitlements: [],
        featureConfig: { free: true },
      };
      setPlans(nextPlans.some((plan) => plan.key === 'BASIC') ? nextPlans : [
        {
          ...basicPlan,
        },
        ...nextPlans,
      ]);
    }

    if (subscriptionsResult.ok && subscriptionsResult.data?.data) {
      const state = subscriptionsResult.data.data;
      setTrial(state.activeTrial);
      setAiUsage(state.aiUsage);
      setCurrentPlan({
        id: state.currentPlan.id,
        key: state.currentPlan.key,
        name: getAccountTypeLabel(state.currentPlan.key, state.currentPlan.displayName),
        price: Number(state.currentPlan.price ?? 0),
        visibilityBoost: 0,
        description: state.currentPlan.description ?? 'Subscription plan',
        benefits: state.currentPlan.benefits ?? [],
        featuredPriority: 0,
        featuredEligible: false,
        aiAllowance: state.currentPlan.aiAllowance ?? null,
        aiUnlimited: state.currentPlan.aiUnlimited ?? false,
        entitlements: state.currentPlan.entitlements ?? [],
        featureConfig: state.currentPlan.featureConfig ?? {},
      });
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
          advancedCvEligible: item.plan?.entitlements?.includes('AI_CV_IMPROVEMENT') ?? false,
          aiEntitlements,
          aiAllowance: item.plan?.aiAllowance ?? null,
        };
      });
      setSubscriptions(nextSubscriptions);
    } else {
      setSubscriptions([]);
      setTrial(null);
      setTrialOffer({ available: false, durationDays: 7, trialPlanKey: 'PREMIUM' });
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
      currentPlan,
      trial,
      trialOffer,
      aiUsage,
    };
  }, [plans, subscriptions, isLoading, refresh, currentPlan, trial, trialOffer, aiUsage]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscriptions must be used inside SubscriptionProvider');
  return context;
}
