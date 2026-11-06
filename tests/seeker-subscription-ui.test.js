import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('seeker dashboard subscription promotion appears by default, repeats, dismisses, and links to plans', async () => {
  const homepage = await readSource('../src/pages/seeker/Homepage.tsx');
  const styles = await readSource('../src/styles/seeker-home.css');

  assert.match(homepage, /isSubscriptionPromotionVisible,\s*setIsSubscriptionPromotionVisible\]\s*=\s*useState\(true\)/);
  assert.match(homepage, /window\.setInterval\(\(\) => \{\s*setIsSubscriptionPromotionVisible\(true\);\s*\}, 30000\)/);
  assert.match(homepage, /return \(\) => window\.clearInterval\(interval\)/);
  assert.match(homepage, /className="seeker-subscription-promotion"[\s\S]*?to="\/seeker\/subscription"[\s\S]*?View Subscription Plans/);
  assert.match(homepage, /aria-label="Dismiss subscription promotion"[\s\S]*?setIsSubscriptionPromotionVisible\(false\)/);
  assert.match(homepage, /seeker-home__eyebrow[\s\S]*?seeker-subscription-promotion[\s\S]*?<h1>\{fullName/);
  assert.match(styles, /@keyframes seeker-subscription-promotion-enter[\s\S]*?translateX\(-16px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.seeker-subscription-promotion\s*\{\s*animation: none/);
});

test('Profile Settings displays real subscription details only after context loading succeeds', async () => {
  const [profile, context] = await Promise.all([
    readSource('../src/pages/seeker/ProfilePage.tsx'),
    readSource('../src/context/SubscriptionContext.tsx'),
  ]);
  const settingsStart = profile.indexOf("mode === 'settings' ? (");
  const subscriptionSection = profile.indexOf('aria-labelledby="seeker-subscription-title"');
  const cvBranch = profile.indexOf('<section className="seeker-cv-summary seeker-card">', settingsStart);

  assert.ok(settingsStart >= 0 && subscriptionSection > settingsStart && cvBranch > subscriptionSection, 'subscription section is within Settings branch before CV content');
  const settingsBranch = profile.slice(settingsStart, cvBranch);
  assert.equal((settingsBranch.match(/aria-labelledby="seeker-subscription-title"/g) ?? []).length, 1);
  assert.match(settingsBranch, /isSubscriptionLoading[\s\S]*?Loading subscription details/);
  assert.match(settingsBranch, /!isSubscriptionLoading && subscriptionError[\s\S]*?role="alert"/);
  assert.match(settingsBranch, /!isSubscriptionLoading && !subscriptionError[\s\S]*?currentPlan\.name/);
  assert.match(profile, /subscriptions\.find\(\(item\) => item\.seekerId === subscriptionUserId\)/);
  assert.match(profile, /currentSubscription\?\.status/);
  assert.match(profile, /currentPlan\.price, currentPlan\.currency/);
  assert.match(profile, /currentSubscription\?\.renewalDate/);
  assert.match(settingsBranch, /currentPlan\.benefits\.map/);
  assert.match(profile, /formatSubscriptionDate\(trial\?\.endAt\)/);
  assert.match(settingsBranch, /trialEndDate/);
  assert.match(settingsBranch, /Subscribe for This Plan/);
  assert.match(settingsBranch, /to="\/seeker\/subscription"/);
  assert.match(context, /getSeekerSubscriptions\(token\)/);
  assert.match(context, /subscriptionError: string \| null/);
  assert.match(context, /setSubscriptionError\(!subscriptionsResult\.ok[\s\S]*?Subscription details could not be loaded/);
});
