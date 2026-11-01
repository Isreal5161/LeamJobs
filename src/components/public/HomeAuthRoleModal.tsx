import { useEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaBuilding, FaTimes } from 'react-icons/fa';

export type AuthRoleModalMode = 'signup' | 'signin';

type HomeAuthRoleModalProps = {
  mode: AuthRoleModalMode;
  onClose: () => void;
};

function HomeAuthRoleModal({ mode, onClose }: HomeAuthRoleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSignup = mode === 'signup';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    dialog.addEventListener('cancel', handleCancel);
    dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      dialog.removeEventListener('cancel', handleCancel);
      if (dialog.open) dialog.close();
    };
  }, [onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const seekerPath = isSignup ? '/register' : '/login';
  const employerPath = isSignup ? '/employers/register' : '/employers/login';

  return (
    <dialog
      ref={dialogRef}
      className="home-auth-modal"
      aria-labelledby="home-auth-modal-title"
      aria-describedby="home-auth-modal-description"
      onClick={handleBackdropClick}
    >
      <section className="home-auth-modal__panel">
        <button
          type="button"
          className="home-auth-modal__close"
          aria-label="Close role selection"
          onClick={onClose}
          autoFocus
        >
          <FaTimes aria-hidden="true" />
        </button>
        <span className="home-auth-modal__eyebrow">LEAMJOBS</span>
        <h2 id="home-auth-modal-title">{isSignup ? 'Create your LeamJobs account' : 'Welcome back'}</h2>
        <p id="home-auth-modal-description">
          {isSignup ? 'Choose how you want to use LeamJobs.' : 'Choose your account type to continue.'}
        </p>

        <div className="home-auth-modal__roles">
          <Link className="home-auth-role" to={employerPath} onClick={onClose}>
            <span className="home-auth-role__icon home-auth-role__icon--client">
              <FaBuilding aria-hidden="true" />
            </span>
            <span className="home-auth-role__copy">
              <strong>Client / Hiring Manager</strong>
              <span>Find talent and hire professionals.</span>
            </span>
            <FaArrowRight className="home-auth-role__arrow" aria-hidden="true" />
          </Link>
          <Link className="home-auth-role" to={seekerPath} onClick={onClose}>
            <span className="home-auth-role__icon home-auth-role__icon--seeker">
              <FaBriefcase aria-hidden="true" />
            </span>
            <span className="home-auth-role__copy">
              <strong>Freelancer / Job Seeker</strong>
              <span>Discover opportunities and grow your career.</span>
            </span>
            <FaArrowRight className="home-auth-role__arrow" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </dialog>
  );
}

export default HomeAuthRoleModal;
