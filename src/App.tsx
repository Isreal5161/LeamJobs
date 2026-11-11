import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import SeekerLayout from './layouts/SeekerLayout';
import EmployerLayout from './layouts/EmployerLayout';
import AdminLayout from './layouts/AdminLayout';
import { JobStoreProvider } from './context/JobStoreContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import CookieConsentManager from './components/public/CookieConsentManager';
import { applyPageMetadata, getPageMetadata } from './utils/seoMetadata';

const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const CompaniesPage = lazy(() => import('./pages/public/CompaniesPage'));
const FeaturesPage = lazy(() => import('./pages/public/FeaturesPage'));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage'));
const WelcomePage = lazy(() => import('./pages/public/WelcomePage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const SignInPage = lazy(() => import('./pages/public/SignInPage'));
const SignUpPage = lazy(() => import('./pages/public/SignUpPage'));
const VerifyEmailPage = lazy(() => import('./pages/public/VerifyEmailPage'));
const JobDetailsPage = lazy(() => import('./pages/public/JobDetailsPage'));
const CompanyProfilePage = lazy(() => import('./pages/public/CompanyProfilePage'));
const Homepage = lazy(() => import('./pages/seeker/Homepage'));
const JobsPage = lazy(() => import('./pages/seeker/JobsPage'));
const ApplicationsPage = lazy(() => import('./pages/seeker/ApplicationsPage'));
const InterviewsPage = lazy(() => import('./pages/interviews/InterviewsPage'));
const ProfilePage = lazy(() => import('./pages/seeker/ProfilePage'));
const SubscriptionPage = lazy(() => import('./pages/seeker/SubscriptionPage'));
const SubscriptionPaymentResultPage = lazy(() => import('./pages/seeker/SubscriptionPaymentResultPage'));
const PremiumOverviewPage = lazy(() => import('./pages/seeker/PremiumOverviewPage'));
const SavedJobsPage = lazy(() => import('./pages/seeker/SavedJobsPage'));
const JobAlertsPage = lazy(() => import('./pages/seeker/JobAlertsPage'));
const PremiumInsightsPage = lazy(() => import('./pages/seeker/PremiumInsightsPage'));
const OnboardingPage = lazy(() => import('./pages/seeker/OnboardingPage'));
const EmployerDashboardPage = lazy(() => import('./pages/employer/EmployerDashboardPage'));
const EmployerJobsPage = lazy(() => import('./pages/employer/EmployerJobsPage'));
const EmployerApplicantsPage = lazy(() => import('./pages/employer/EmployerApplicantsPage'));
const EmployerCandidatesPage = lazy(() => import('./pages/employer/EmployerCandidatesPage'));
const EmployerProfilePage = lazy(() => import('./pages/employer/EmployerProfilePage'));
const EmployerVerificationPage = lazy(() => import('./pages/employer/EmployerVerificationPage'));
const EmployerContractsPage = lazy(() => import('./pages/employer/EmployerContractsPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminModerationPage = lazy(() => import('./pages/admin/AdminModerationPage'));
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage'));
const AdminApplicantsPage = lazy(() => import('./pages/admin/AdminApplicantsPage'));
const AdminApplicantDetailPage = lazy(() => import('./pages/admin/AdminApplicantDetailPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'));
const AdminSeekersPage = lazy(() => import('./pages/admin/AdminSeekersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const SeekerPaymentsPage = lazy(() => import('./pages/seeker/PaymentsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const AdminWithdrawalsPage = lazy(() => import('./pages/admin/AdminWithdrawalsPage'));
const AdminContractsPage = lazy(() => import('./pages/admin/AdminContractsPage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminCompaniesPage = lazy(() => import('./pages/admin/AdminCompaniesPage'));
const AdminFiltersPage = lazy(() => import('./pages/admin/AdminFiltersPage'));
const AdminRecommendationsPage = lazy(() => import('./pages/admin/AdminRecommendationsPage'));
const ContractPage = lazy(() => import('./pages/contracts/ContractPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage'));
const SettingsPage = lazy(() => import('./pages/settings/EmailPreferencesPage'));
const PublicJobUpdatesUnsubscribePage = lazy(() => import('./pages/public/PublicJobUpdatesUnsubscribePage'));
const MarketingUnsubscribePage = lazy(() => import('./pages/public/MarketingUnsubscribePage'));
const AdminCommunicationsPage = lazy(() => import('./pages/admin/AdminCommunicationsPage'));
const AdminVerificationPage = lazy(() => import('./pages/admin/AdminVerificationPage'));
const PublicJobsPage = lazy(() => import('./pages/public/PublicJobsPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LegalPage = lazy(() => import('./pages/public/LegalPage'));

const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage'));
const AdminInvitationAcceptancePage = lazy(() => import('./pages/admin/AdminInvitationAcceptancePage'));

function RouteMetadataController() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (/^\/jobs\/[^/]+\/?$/.test(pathname)) return;
    applyPageMetadata(getPageMetadata(pathname));
  }, [pathname]);

  return null;
}

function App() {
  return (
    <JobStoreProvider>
      <SiteContentProvider>
          <SubscriptionProvider>
        <RouteMetadataController />
        <CookieConsentManager />
        <Suspense fallback={<div role="status">Loading page...</div>}>
          <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<WelcomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/:employerId" element={<CompanyProfilePage />} />
            <Route path="jobs" element={<PublicJobsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="terms" element={<LegalPage document="terms" />} />
            <Route path="privacy" element={<LegalPage document="privacy" />} />
            <Route path="cookies" element={<LegalPage document="cookies" />} />
            <Route path="payment-policy" element={<LegalPage document="payments" />} />
            <Route path="freelancer-terms" element={<LegalPage document="freelancer" />} />
            <Route path="employer-terms" element={<LegalPage document="employer" />} />
            <Route path="login" element={<SignInPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="unsubscribe-job-updates" element={<PublicJobUpdatesUnsubscribePage />} />
            <Route path="unsubscribe-marketing" element={<MarketingUnsubscribePage />} />
            <Route path="signin" element={<Navigate to="/login" replace />} />
            <Route path="register" element={<SignUpPage />} />
            <Route path="signup" element={<Navigate to="/register" replace />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="employers/login" element={<SignInPage role="employer" />} />
            <Route path="employers/signin" element={<Navigate to="/employers/login" replace />} />
            <Route path="employers/register" element={<SignUpPage role="employer" />} />
            <Route path="employers/signup" element={<Navigate to="/employers/register" replace />} />
            <Route path="employers/verify-email" element={<VerifyEmailPage role="employer" />} />
            <Route path="jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route
            path="/admin/accept-invitation"
            element={(
              <Suspense fallback={<div className="admin-staff-loading" role="status">Loading invitation form…</div>}>
                <AdminInvitationAcceptancePage />
              </Suspense>
            )}
          />
          <Route path="/Leamjobs2026admin/login" element={<AdminLoginPage />} />
          <Route path="/seeker" element={<ProtectedRoute allowedRoles={['SEEKER']}><SeekerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Homepage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="companies/:employerId" element={<CompanyProfilePage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="interviews" element={<InterviewsPage role="seeker" />} />
            <Route path="interviews/:interviewId" element={<InterviewsPage role="seeker" />} />
            <Route path="contracts/:contractId" element={<ContractPage role="SEEKER" />} />
            <Route path="messages" element={<MessagesPage role="seeker" />} />
            <Route path="cv" element={<ProfilePage key="cv" mode="cv" />} />
            <Route path="profile" element={<ProfilePage key="settings" mode="settings" />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="subscription/payment-result" element={<SubscriptionPaymentResultPage />} />
            <Route path="premium" element={<PremiumOverviewPage />} />
            <Route path="saved-jobs" element={<SavedJobsPage />} />
            <Route path="job-alerts" element={<JobAlertsPage />} />
            <Route path="premium-insights" element={<PremiumInsightsPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="payments" element={<SeekerPaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage role="seeker" />} />
            <Route path="settings" element={<SettingsPage role="seeker" />} />
          </Route>
          <Route path="/employer" element={<ProtectedRoute allowedRoles={['EMPLOYER']}><EmployerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployerDashboardPage />} />
            <Route path="jobs" element={<EmployerJobsPage />} />
            <Route path="candidates" element={<EmployerCandidatesPage />} />
            <Route path="applicants" element={<EmployerApplicantsPage />} />
            <Route path="interviews" element={<InterviewsPage role="employer" />} />
            <Route path="interviews/:interviewId" element={<InterviewsPage role="employer" />} />
            <Route path="contracts" element={<EmployerContractsPage />} />
            <Route path="contracts/:contractId" element={<ContractPage role="EMPLOYER" />} />
            <Route path="messages" element={<MessagesPage role="employer" />} />
            <Route path="profile" element={<EmployerProfilePage />} />
            <Route path="verification" element={<EmployerVerificationPage />} />
            <Route path="notifications" element={<NotificationsPage role="employer" />} />
            <Route path="settings" element={<SettingsPage role="employer" />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="moderation" replace />} />
            <Route path="dashboard" element={<AdminOverviewPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="jobs/:jobId/applicants" element={<AdminApplicantsPage />} />
            <Route path="jobs/:jobId/applicants/:applicationId" element={<AdminApplicantDetailPage />} />
            <Route path="contracts/:contractId" element={<ContractPage role="ADMIN" />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="filters" element={<AdminFiltersPage />} />
            <Route path="recommendations" element={<AdminRecommendationsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="seekers" element={<AdminSeekersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="contracts" element={<AdminContractsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="verifications" element={<AdminVerificationPage />} />
            <Route path="notifications" element={<NotificationsPage role="admin" />} />
            <Route path="communications" element={<AdminCommunicationsPage />} />
            <Route
              path="staff"
              element={(
                <Suspense fallback={<div className="admin-staff-loading" role="status">Loading staff management…</div>}>
                  <AdminStaffPage />
                </Suspense>
              )}
            />
            <Route path="settings" element={<SettingsPage role="admin" />} />
          </Route>
          </Routes>
        </Suspense>
          </SubscriptionProvider>
      </SiteContentProvider>
    </JobStoreProvider>
  );
}

export default App;
