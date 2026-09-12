type AdminPageSkeletonProps = {
  statCards?: number;
  rows?: number;
  showToolbar?: boolean;
};

function AdminPageSkeleton({ statCards = 4, rows = 4, showToolbar = true }: AdminPageSkeletonProps) {
  return (
    <div className="admin-page admin-page-skeleton" aria-live="polite" aria-label="Loading admin page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow leamjobs-skeleton-line admin-page-skeleton__eyebrow" aria-hidden="true" />
          <span className="leamjobs-skeleton-line admin-page-skeleton__title" aria-hidden="true" />
          <span className="leamjobs-skeleton-line admin-page-skeleton__subtitle" aria-hidden="true" />
        </div>
      </section>

      {showToolbar ? (
        <section className="admin-panel admin-page-skeleton__toolbar" aria-hidden="true">
          <span className="leamjobs-skeleton-line admin-page-skeleton__toolbar-line" />
          <span className="leamjobs-skeleton-line admin-page-skeleton__toolbar-chip" />
          <span className="leamjobs-skeleton-line admin-page-skeleton__toolbar-chip" />
          <span className="leamjobs-skeleton-line admin-page-skeleton__toolbar-chip" />
        </section>
      ) : null}

      <section className="admin-panel admin-page-skeleton__stats" aria-hidden="true">
        {Array.from({ length: statCards }, (_, index) => (
          <div key={index} className="admin-page-skeleton__stat-card">
            <span className="admin-stat-card__icon leamjobs-skeleton-block admin-page-skeleton__icon" />
            <div>
              <span className="leamjobs-skeleton-line admin-page-skeleton__stat-value" />
              <span className="leamjobs-skeleton-line admin-page-skeleton__stat-label" />
            </div>
          </div>
        ))}
      </section>

      <section className="admin-panel admin-page-skeleton__list" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="admin-page-skeleton__row">
            <span className="admin-page-skeleton__avatar leamjobs-skeleton-circle" />
            <span className="admin-page-skeleton__content">
              <span className="leamjobs-skeleton-line admin-page-skeleton__line admin-page-skeleton__line--large" />
              <span className="leamjobs-skeleton-line admin-page-skeleton__line" />
              <span className="leamjobs-skeleton-line admin-page-skeleton__line admin-page-skeleton__line--short" />
            </span>
            <span className="leamjobs-skeleton-line admin-page-skeleton__pill" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default AdminPageSkeleton;
