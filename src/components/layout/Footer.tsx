function Footer() {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '2rem 0', marginTop: '3rem' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
        <p style={{ margin: 0 }}>&copy; 2026 JobPortal. Crafted for modern hiring experiences.</p>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
