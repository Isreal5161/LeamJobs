import { FaEnvelope } from 'react-icons/fa';

function ContactPage() {
  return (
    <main className="public-contact-page">
      <section className="public-contact-card">
        <span className="public-contact-card__icon" aria-hidden="true"><FaEnvelope /></span>
        <span className="public-contact-eyebrow">We’re here to help</span>
        <h1>Contact LeamJobs</h1>
        <p>Questions about finding work, hiring, or using LeamJobs? Send our support team an email and we’ll be happy to help.</p>
        <a className="public-contact-email" href="mailto:support@leamjobs.com">support@leamjobs.com</a>
      </section>
    </main>
  );
}

export default ContactPage;
