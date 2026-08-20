import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section style={{ padding: '6rem 0', textAlign: 'center' }}>
      <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em' }}>
        404
      </p>
      <h1 style={{ margin: '1rem 0', fontSize: '2rem' }}>Page not found</h1>
      <p style={{ margin: 0, color: '#64748b' }}>The page you are looking for doesn’t exist or may have been moved.</p>
      <Link to="/" style={{ marginTop: '1.5rem', display: 'inline-flex', padding: '0.85rem 1.5rem', borderRadius: '999px', background: '#2563eb', color: '#fff' }}>
        Return home
      </Link>
    </section>
  );
}

export default NotFoundPage;
