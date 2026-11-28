import { useNavigate, useSearchParams } from 'react-router-dom';
import HomeAuthRoleModal from '../../components/public/HomeAuthRoleModal';

function ChooseSignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get('oauth_error') === 'google_email_unverified'
    ? 'Google could not verify the email address. Choose an account type to sign in, or retry with a verified Google account.'
    : undefined;

  return (
    <section className="auth-page auth-page--role-choice" aria-label="Choose an account type to sign in">
      <HomeAuthRoleModal mode="signin" notice={notice} onClose={() => navigate('/', { replace: true })} />
    </section>
  );
}

export default ChooseSignInPage;
