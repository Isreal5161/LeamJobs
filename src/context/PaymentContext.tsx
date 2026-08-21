import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type PaymentStatus = 'Awaiting payment' | 'Paid to admin' | 'In progress' | 'Completed' | 'Credited' | 'Withdrawn';
export type WithdrawalStatus = 'Pending' | 'Approved' | 'Paid' | 'Declined';

export type JobPayment = {
  id: string;
  jobId: string;
  jobTitle: string;
  employer: string;
  seeker: string;
  amount: number;
  paymentType: 'One-time payment';
  fee: number;
  status: PaymentStatus;
  paidAt?: string;
  completedAt?: string;
};

export type Withdrawal = {
  id: string;
  seeker: string;
  amount: number;
  fee: number;
  payout: number;
  method: string;
  status: WithdrawalStatus;
  requestedAt: string;
};

const initialPayments: JobPayment[] = [
  {
    id: 'payment-google-sarah',
    jobId: 'google',
    jobTitle: 'Senior Product Designer',
    employer: 'Google',
    seeker: 'Sarah Johnson',
    amount: 1800,
    paymentType: 'One-time payment',
    fee: 180,
    status: 'Paid to admin',
    paidAt: 'Aug 18, 2026',
  },
  {
    id: 'payment-amazon-michael',
    jobId: 'amazon',
    jobTitle: 'Senior UI/UX Designer',
    employer: 'Amazon',
    seeker: 'Michael Chen',
    amount: 1450,
    paymentType: 'One-time payment',
    fee: 145,
    status: 'Completed',
    paidAt: 'Aug 12, 2026',
    completedAt: 'Aug 19, 2026',
  },
  {
    id: 'payment-spotify-amina',
    jobId: 'spotify',
    jobTitle: 'Senior Product Designer',
    employer: 'Spotify',
    seeker: 'Amina Bello',
    amount: 1600,
    paymentType: 'One-time payment',
    fee: 160,
    status: 'Credited',
    paidAt: 'Aug 10, 2026',
    completedAt: 'Aug 17, 2026',
  },
  {
    id: 'payment-microsoft-priya',
    jobId: 'microsoft',
    jobTitle: 'UX Designer',
    employer: 'Microsoft',
    seeker: 'Priya Nair',
    amount: 1500,
    paymentType: 'One-time payment',
    fee: 150,
    status: 'Awaiting payment',
  },
];

const initialWithdrawals: Withdrawal[] = [
  {
    id: 'withdrawal-sarah-1',
    seeker: 'Sarah Johnson',
    amount: 1250,
    fee: 125,
    payout: 1125,
    method: 'Bank transfer ending 4280',
    status: 'Pending',
    requestedAt: 'Aug 20, 2026',
  },
];

type PaymentContextValue = {
  payments: JobPayment[];
  withdrawals: Withdrawal[];
  platformFeePercent: number;
  confirmEmployerPayment: (paymentId: string) => void;
  markJobCompleted: (paymentId: string) => void;
  creditSeeker: (paymentId: string) => void;
  requestWithdrawal: (seeker: string, amount: number, method: string) => void;
  updateWithdrawalStatus: (withdrawalId: string, status: WithdrawalStatus) => void;
};

const PaymentContext = createContext<PaymentContextValue | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState(initialPayments);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const platformFeePercent = 10;

  const value = useMemo<PaymentContextValue>(() => ({
    payments,
    withdrawals,
    platformFeePercent,
    confirmEmployerPayment: (paymentId) => setPayments((current) => current.map((payment) => payment.id === paymentId ? { ...payment, status: 'Paid to admin', paidAt: 'Aug 21, 2026' } : payment)),
    markJobCompleted: (paymentId) => setPayments((current) => current.map((payment) => payment.id === paymentId && payment.status === 'Paid to admin' ? { ...payment, status: 'Completed', completedAt: 'Aug 21, 2026' } : payment)),
    creditSeeker: (paymentId) => setPayments((current) => current.map((payment) => payment.id === paymentId && payment.status === 'Completed' ? { ...payment, status: 'Credited' } : payment)),
    requestWithdrawal: (seeker, amount, method) => {
      const fee = Math.round(amount * platformFeePercent / 100);
      setWithdrawals((current) => [{ id: `withdrawal-${Date.now()}`, seeker, amount, fee, payout: amount - fee, method, status: 'Pending', requestedAt: 'Aug 21, 2026' }, ...current]);
    },
    updateWithdrawalStatus: (withdrawalId, status) => setWithdrawals((current) => current.map((withdrawal) => withdrawal.id === withdrawalId ? { ...withdrawal, status } : withdrawal)),
  }), [payments, withdrawals]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayments must be used inside PaymentProvider');
  return context;
}
