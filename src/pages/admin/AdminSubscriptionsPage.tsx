import { useState } from 'react';
import { FaCheckCircle, FaCrown, FaUserShield, FaUsers } from 'react-icons/fa';
import { useSubscriptions, type SubscriptionPlanId, type SubscriptionStatus } from '../../context/SubscriptionContext';

function AdminSubscriptionsPage() {
  const {
    subscriptions,
    plans,
    updateSubscription,
    updateSubscriptionStatus,
    updatePlan,
    toggleFeatured,
    getRecommendationScore,
  } = useSubscriptions();

  const [saveNotice, setSaveNotice] = useState('No changes saved yet');

  const active = subscriptions.filter((subscription) => subscription.status === 'Active');
  const featured = active.filter((subscription) => subscription.featured);
  const monthlyRevenue = active.reduce((total, subscription) => total + (plans.find((plan) => plan.id === subscription.planId)?.price ?? 0), 0);

  const handleSaveSubscriptionChanges = () => {
    setSaveNotice(`Subscription settings updated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  return (
    <div className="subscription-page">
      <section className="subscription-hero">
        <div>
          <span>Admin monetization</span>
          <h1>Subscriber management</h1>
          <p>Control pricing, featured visibility, and recommendation weighting for subscribed users.</p>
        </div>
        <FaCrown />
      </section>

      <section className="subscription-stat-grid">
        <article>
          <span>Total subscribers</span>
          <strong>{subscriptions.length}</strong>
          <small>Free and paid seeker profiles</small>
        </article>
        <article>
          <span>Active paid plans</span>
          <strong>{active.filter((subscription) => subscription.planId !== 'free').length}</strong>
          <small>Professional and Premium</small>
        </article>
        <article>
          <span>Monthly revenue</span>
          <strong>${monthlyRevenue}</strong>
          <small>Live demo subscription revenue</small>
        </article>
        <article>
          <span>Featured users</span>
          <strong>{featured.length}</strong>
          <small>Currently boosted in rankings</small>
        </article>
      </section>

      <section className="subscription-panel subscription-panel--editor">
        <div className="subscription-heading">
          <div>
            <span><FaUserShield /> Plan configuration</span>
            <h2>Plan details</h2>
          </div>
          <button type="button" className="subscription-action-button" onClick={handleSaveSubscriptionChanges}>
            Update subscription
          </button>
        </div>

        <p className="subscription-editor-copy">Set subscription amounts and recommendation boosts</p>

        <div className="subscription-plan-grid">
          {plans.map((plan) => (
            <article className="subscription-plan" key={plan.id}>
              <label className="subscription-input">
                <span>Plan name</span>
                <input
                  type="text"
                  value={plan.name}
                  onChange={(event) => updatePlan(plan.id, { name: event.target.value })}
                />
              </label>
              <strong>${plan.price}<small>/month</small></strong>
              <label className="subscription-input">
                <span>Monthly amount</span>
                <input
                  type="number"
                  min={0}
                  value={plan.price}
                  onChange={(event) => updatePlan(plan.id, { price: Number(event.target.value) || 0 })}
                />
              </label>
              <label className="subscription-input">
                <span>Plan description</span>
                <textarea
                  value={plan.description}
                  rows={3}
                  onChange={(event) => updatePlan(plan.id, { description: event.target.value })}
                />
              </label>
              <div className="subscription-benefits-editor">
                <span>Benefits</span>
                <div className="subscription-benefits-list">
                  {plan.benefits.map((benefit, index) => (
                    <div className="subscription-benefit-item" key={`${plan.id}-benefit-${index}`}>
                      <input
                        type="text"
                        value={benefit}
                        onChange={(event) => {
                          const nextBenefits = [...plan.benefits];
                          nextBenefits[index] = event.target.value;
                          updatePlan(plan.id, { benefits: nextBenefits });
                        }}
                      />
                      <button
                        type="button"
                        className="subscription-benefit-remove"
                        onClick={() => updatePlan(plan.id, {
                          benefits: plan.benefits.filter((_, benefitIndex) => benefitIndex !== index),
                        })}
                        aria-label={`Remove benefit ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="subscription-benefit-add"
                  onClick={() => updatePlan(plan.id, {
                    benefits: [...plan.benefits, 'New benefit'],
                  })}
                >
                  + Add benefit
                </button>
              </div>
              <label className="subscription-input">
                <span>Boost %</span>
                <input
                  type="number"
                  min={0}
                  value={plan.visibilityBoost}
                  onChange={(event) => updatePlan(plan.id, { visibilityBoost: Number(event.target.value) || 0 })}
                />
              </label>
              <label className="subscription-input">
                <span>Featured priority</span>
                <input
                  type="number"
                  min={0}
                  value={plan.featuredPriority}
                  onChange={(event) => updatePlan(plan.id, { featuredPriority: Number(event.target.value) || 0 })}
                />
              </label>
              <label className="subscription-checkbox">
                <input
                  type="checkbox"
                  checked={plan.featuredEligible}
                  onChange={(event) => updatePlan(plan.id, { featuredEligible: event.target.checked })}
                />
                <span>Eligible for featured placement</span>
              </label>
            </article>
          ))}
        </div>

        <div className="subscription-save-row">
          <span className="subscription-save-status">{saveNotice}</span>
          <button type="button" className="subscription-action-button subscription-action-button--secondary" onClick={handleSaveSubscriptionChanges}>
            Save changes
          </button>
        </div>
      </section>

      <section className="subscription-panel">
        <div className="subscription-heading">
          <div>
            <span><FaUsers /> Subscriber directory</span>
            <h2>Manage seeker subscriptions</h2>
          </div>
        </div>

        <div className="subscription-list">
          {subscriptions.map((subscription) => {
            const plan = plans.find((item) => item.id === subscription.planId) ?? plans[0];
            return (
              <article className="subscription-row" key={subscription.seekerId}>
                <div>
                  <strong>{subscription.seekerName}</strong>
                  <p>{subscription.email} / Renews {subscription.renewalDate}</p>
                </div>

                <select
                  value={subscription.planId}
                  onChange={(event) => updateSubscription(subscription.seekerId, event.target.value as SubscriptionPlanId)}
                  aria-label={`Plan for ${subscription.seekerName}`}
                >
                  {plans.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} - ${item.price}/month</option>
                  ))}
                </select>

                <span className="subscription-boost">+{plan.visibilityBoost}% boost</span>

                <select
                  value={subscription.status}
                  onChange={(event) => updateSubscriptionStatus(subscription.seekerId, event.target.value as SubscriptionStatus)}
                  aria-label={`Status for ${subscription.seekerName}`}
                >
                  {['Active', 'Cancelled', 'Expired'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`subscription-feature-toggle ${subscription.featured ? 'subscription-feature-toggle--active' : ''}`}
                  onClick={() => toggleFeatured(subscription.seekerId)}
                >
                  {subscription.featured ? 'Featured' : 'Feature'}
                </button>

                <span className={`subscription-status subscription-status--${subscription.status.toLowerCase()}`}>
                  {subscription.status}
                </span>

                <strong className="subscription-score">Score: {getRecommendationScore(subscription.seekerId)}</strong>
              </article>
            );
          })}
        </div>

        <div className="subscription-row-action">
          <button type="button" className="subscription-action-button" onClick={handleSaveSubscriptionChanges}>
            Apply updates
          </button>
        </div>
      </section>
    </div>
  );
}

export default AdminSubscriptionsPage;
