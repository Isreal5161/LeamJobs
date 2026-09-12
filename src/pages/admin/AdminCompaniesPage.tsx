import { useEffect, useRef, useState } from 'react';
import { FaBuilding, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminCompanies, getAdminCompanyLogo, type AdminCompany } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const PAGE_SIZE = 20;

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

const formatWebsite = (website: string | null) => {
  if (!website) return 'No website provided';
  return website.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

function AdminCompanyLogo({ company, token }: { company: AdminCompany; token: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const initials = company.companyName.slice(0, 1).toUpperCase();

  useEffect(() => {
    let active = true;
    setLogoUrl(null);
    setHasError(false);

    if (!company.companyLogoUrl) {
      return () => { active = false; };
    }

    void getAdminCompanyLogo(company.userId, token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setHasError(true);
        return;
      }

      const nextObjectUrl = URL.createObjectURL(result.data);
      objectUrlRef.current = nextObjectUrl;
      setLogoUrl(nextObjectUrl);
    });

    return () => {
      active = false;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, [company.companyLogoUrl, company.userId, token]);

  const handleImageError = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setLogoUrl(null);
    setHasError(true);
  };

  return (
    <div className="admin-company-logo">
      {logoUrl && !hasError ? <img src={logoUrl} alt="" onError={handleImageError} /> : initials}
    </div>
  );
}

function AdminCompaniesPage() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'companyName' | 'jobCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setCompanies([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadCompanies = async () => {
      setIsLoading(true);
      setError('');
      const result = await getAdminCompanies(token, {
        page,
        limit: PAGE_SIZE,
        search,
        industry: industry || undefined,
        companySize: companySize || undefined,
        sortBy,
        sortOrder,
      });

      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load companies.');
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      setCompanies(result.data.data.companies);
      setPagination(result.data.data.pagination);
      setIsLoading(false);
    };

    void loadCompanies();
    return () => { active = false; };
  }, [token, page, search, industry, companySize, sortBy, sortOrder]);

  const resetPage = () => setPage(1);

  return (
    <div className="admin-page admin-companies-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow"><FaBuilding /> Company administration</span>
          <h1>Companies</h1>
          <p>Review employer profiles, account status, and job activity from the live directory.</p>
        </div>
      </section>

      <section className="admin-panel admin-companies-toolbar" aria-label="Company filters">
        <label className="admin-companies-search">
          <span>Search companies</span>
          <span className="admin-companies-search__input"><FaSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Company name or employer email" /></span>
        </label>
        <label>
          <span>Industry</span>
          <input value={industry} onChange={(event) => { setIndustry(event.target.value); resetPage(); }} placeholder="Any industry" />
        </label>
        <label>
          <span>Company size</span>
          <input value={companySize} onChange={(event) => { setCompanySize(event.target.value); resetPage(); }} placeholder="Any size" />
        </label>
        <label>
          <span>Sort by</span>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); resetPage(); }}>
            <option value="createdAt">Joined date</option>
            <option value="companyName">Company name</option>
            <option value="jobCount">Job count</option>
          </select>
        </label>
        <label>
          <span>Order</span>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as typeof sortOrder); resetPage(); }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </section>

      <section className="admin-panel admin-companies-list" aria-live="polite">
        <div className="admin-section-heading">
          <div>
            <span><FaBuilding /> Employer directory</span>
            <h2>{pagination.total} companies</h2>
          </div>
        </div>

        {isLoading ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={4} /> : null}
        {!isLoading && error ? <p className="admin-companies-message admin-companies-message--error">{error}</p> : null}
        {!isLoading && !error && companies.length === 0 ? <p className="admin-companies-message">No companies match the selected filters.</p> : null}

        {!isLoading && !error && companies.length > 0 ? (
          <div className="admin-companies-table-wrap">
            <table className="admin-companies-table">
              <thead><tr><th>Company</th><th>Contact</th><th>Profile</th><th>Account</th><th>Jobs</th><th>Joined</th></tr></thead>
              <tbody>{companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="admin-company-identity">
                      <AdminCompanyLogo company={company} token={token ?? ''} />
                      <div><strong>{company.companyName}</strong><span>{formatWebsite(company.website)}</span></div>
                    </div>
                  </td>
                  <td><strong>{company.firstName} {company.lastName}</strong><span>{company.email}</span></td>
                  <td><strong>{company.industry || 'Industry not provided'}</strong><span>{company.companySize || 'Size not provided'} / {company.location || 'Location not provided'}</span></td>
                  <td><div className="admin-companies-status"><span className={`admin-status ${company.isActive ? 'admin-status--approved' : 'admin-status--declined'}`}>{company.isActive ? 'Active' : 'Inactive'}</span><small className={company.isVerified ? 'admin-companies-verified' : 'admin-companies-unverified'}>{company.isVerified ? 'Verified' : 'Unverified'}</small></div></td>
                  <td><strong>{company.jobCount}</strong><span>all job posts</span></td>
                  <td>{formatDate(company.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : null}

        {pagination.pages > 1 ? <div className="admin-companies-pagination"><button className="admin-button admin-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="admin-button admin-button--secondary" type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div> : null}
      </section>
    </div>
  );
}

export default AdminCompaniesPage;