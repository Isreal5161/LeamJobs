import { useState } from 'react';
import { FaArrowDown, FaBriefcase, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { usePayments } from '../../context/PaymentContext';

function PaymentsPage() {
  const { payments, withdrawals, platformFeePercent, requestWithdrawal } = usePayments();
  const [amount, setAmount] = useState('');
  const credited = payments.filter((payment) => payment.seeker === 'Sarah Johnson' && payment.status === 'Credited');
  const available = credited.reduce((total, payment) => total + payment.amount - payment.fee, 0);
  const pending = payments.filter((payment) => payment.seeker === 'Sarah Johnson' && payment.status !== 'Credited').reduce((total, payment) => total + payment.amount, 0);
  const myWithdrawals = withdrawals.filter((withdrawal) => withdrawal.seeker === 'Sarah Johnson');

  const withdraw = () => {
    const value = Number(amount);
    if (!value || value <= 0 || value > available) return;
    requestWithdrawal('Sarah Johnson', value, 'Bank transfer ending 4280');
    setAmount('');
  };

  return <div className="payment-page"><section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Track completed work, available balance, and withdrawal requests.</p></div><FaMoneyBillWave /></section>
    <section className="payment-stat-grid"><article><span>Available balance</span><strong>${available.toLocaleString()}</strong><small>Ready to withdraw</small></article><article><span>Pending earnings</span><strong>${pending.toLocaleString()}</strong><small>Waiting for completion or credit</small></article><article><span>Platform fee</span><strong>{platformFeePercent}%</strong><small>Applied at withdrawal</small></article></section>
    <main className="payment-content-grid"><section className="payment-panel"><div className="payment-heading"><div><span><FaArrowDown /> Withdraw balance</span><h2>Request a payout</h2></div></div><div className="payment-withdraw-box"><label>Amount<input type="number" min="1" max={available} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={`Up to $${available.toLocaleString()}`} /></label><p>You receive ${amount ? Math.max(Number(amount) - Math.round(Number(amount) * platformFeePercent / 100), 0).toLocaleString() : '0'} after the {platformFeePercent}% admin fee.</p><button type="button" onClick={withdraw}>Request withdrawal</button></div></section><section className="payment-panel"><div className="payment-heading"><div><span><FaReceipt /> Earnings</span><h2>Job payment history</h2></div></div><div className="payment-list">{payments.filter((payment) => payment.seeker === 'Sarah Johnson').map((payment) => <article className="payment-row" key={payment.id}><div><strong>{payment.jobTitle}</strong><p>{payment.employer} / {payment.status}</p></div><strong>${(payment.amount - payment.fee).toLocaleString()}</strong></article>)}</div></section></main>
    <section className="payment-panel"><div className="payment-heading"><div><span><FaArrowDown /> Withdrawals</span><h2>Withdrawal history</h2></div></div><div className="payment-list">{myWithdrawals.map((withdrawal) => <article className="payment-row" key={withdrawal.id}><div><strong>${withdrawal.amount.toLocaleString()} request</strong><p>{withdrawal.method} / {withdrawal.requestedAt}</p></div><span className={`payment-status payment-status--${withdrawal.status.toLowerCase()}`}>{withdrawal.status}</span><strong>${withdrawal.payout.toLocaleString()} payout</strong></article>)}</div></section>
  </div>;
}
export default PaymentsPage;
