import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import SeekerLayout from './layouts/SeekerLayout';
import EmployerLayout from './layouts/EmployerLayout';
import AdminLayout from './layouts/AdminLayout';
import AboutPage from './pages/public/AboutPage';
import CompaniesPage from './pages/public/CompaniesPage';
import FeaturesPage from './pages/public/FeaturesPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import WelcomePage from './pages/public/WelcomePage';
import NotFoundPage from './pages/public/NotFoundPage';
import SignInPage from './pages/public/SignInPage';
import SignUpPage from './pages/public/SignUpPage';
import JobDetailsPage from './pages/public/JobDetailsPage';
import Homepage from './pages/seeker/Homepage';
import JobsPage from './pages/seeker/JobsPage';
import ApplicationsPage from './pages/seeker/ApplicationsPage';
import ProfilePage from './pages/seeker/ProfilePage';
import EmployerDashboardPage from './pages/employer/EmployerDashboardPage';
import EmployerJobsPage from './pages/employer/EmployerJobsPage';
import EmployerApplicantsPage from './pages/employer/EmployerApplicantsPage';
import EmployerProfilePage from './pages/employer/EmployerProfilePage';
import MessagesPage from './pages/messages/MessagesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminModerationPage from './pages/admin/AdminModerationPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminContentPage from './pages/admin/AdminContentPage';
import AdminSeekersPage from './pages/admin/AdminSeekersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import { JobStoreProvider } from './context/JobStoreContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { PaymentProvider } from './context/PaymentContext';
import SeekerPaymentsPage from './pages/seeker/PaymentsPage';
import EmployerPaymentsPage from './pages/employer/PaymentsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <JobStoreProvider>
      <SiteContentProvider>
        <PaymentProvider>
          <SubscriptionProvider>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<WelcomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="login" element={<SignInPage />} />
            <Route path="signin" element={<Navigate to="/login" replace />} />
            <Route path="register" element={<SignUpPage />} />
            <Route path="signup" element={<Navigate to="/register" replace />} />
            <Route path="employers/login" element={<SignInPage role="employer" />} />
            <Route path="employers/signin" element={<Navigate to="/employers/login" replace />} />
            <Route path="employers/register" element={<SignUpPage role="employer" />} />
            <Route path="employers/signup" element={<Navigate to="/employers/register" replace />} />
            <Route path="jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/seeker" element={<SeekerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Homepage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="messages" element={<MessagesPage role="seeker" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="payments" element={<SeekerPaymentsPage />} />
          </Route>
          <Route path="/employer" element={<EmployerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployerDashboardPage />} />
            <Route path="jobs" element={<EmployerJobsPage />} />
            <Route path="applicants" element={<EmployerApplicantsPage />} />
            <Route path="messages" element={<MessagesPage role="employer" />} />
            <Route path="profile" element={<EmployerProfilePage />} />
            <Route path="payments" element={<EmployerPaymentsPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="dashboard" element={<AdminOverviewPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="filters" element={<AdminDashboardPage />} />
            <Route path="recommendations" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminDashboardPage />} />
            <Route path="companies" element={<AdminDashboardPage />} />
            <Route path="seekers" element={<AdminSeekersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
          </Route>
        </Routes>
          </SubscriptionProvider>
        </PaymentProvider>
      </SiteContentProvider>
    </JobStoreProvider>
  );
}

export default App;
