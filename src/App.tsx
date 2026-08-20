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

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<WelcomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/seeker" element={<SeekerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<div>Seeker dashboard placeholder</div>} />
      </Route>
      <Route path="/employer" element={<EmployerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<div>Employer dashboard placeholder</div>} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<div>Admin dashboard placeholder</div>} />
      </Route>
    </Routes>
  );
}

export default App;
