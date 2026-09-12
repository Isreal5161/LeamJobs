import { useEffect, useState } from 'react';
import { FaFileAlt, FaMapMarkerAlt, FaSearch, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminSeekers, type AdminSeeker } from '../../services/api';

const PAGE_SIZE = 20;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : 'Never';

const fullName = (seeker: AdminSeeker) => `${seeker.firstName} ${seeker.lastName}`.trim() || 'Unnamed seeker';

const initials = (seeker: AdminSeeker) => fullName(seeker).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'S';

function AdminSeekersPage() {
  const { token } = useAuth();
  const [seekers, setSeekers] = useState<AdminSeeker[]>([]);
  const [selectedSeekerId, setSelectedSeekerId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verification, setVerification] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastLogin' | 'applicationCount' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setSeekers([]);
      setSelectedSeekerId('');
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadSeekers = async () => {
      setIsLoading(true);
      setError('');
      const result = await getAdminSeekers(token, {
        page,
        limit: PAGE_SIZE,
        search,
        status: status ? status as 'ACTIVE' | 'INACTIVE' : undefined,
        verification: verification ? verification as 'VERIFIED' | 'UNVERIFIED' : undefined,
        location,
        sortBy,
        sortOrder,
      });

      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load seekers.');
        setSeekers([]);
        setSelectedSeekerId('');
        setIsLoading(false);
        return;
      }

      const nextSeekers = result.data.data.seekers;
      setSeekers(nextSeekers);
      setPagination(result.data.data.pagination);
      setSelectedSeekerId((current) => nextSeekers.some((seeker) => seeker.id === current) ? current : nextSeekers[0]?.id ?? '');
      setIsLoading(false);
    };

    void loadSeekers();
    return () => { active = false; };
  }, [token, page, search, status, verification, location, sortBy, sortOrder]);

  const selectedSeeker = seekers.find((seeker) => seeker.id === selectedSeekerId) ?? null;
  const resetPage = () => setPage(1);

  return (
    <div className="admin-page admin-real-seekers-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow"><FaUsers /> Seeker administration</span>
          <h1>Job seekers</h1>
          <p>Review real seeker accounts, profile details, and application activity.</p>
        </div>
      </section>

      <section className="admin-panel admin-real-seekers-toolbar" aria-label="Seeker filters">
        <label className="admin-real-seekers-search">
          <span>Search seekers</span>
          <span className="admin-real-seekers-search__input"><FaSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Name or email" /></span>
        </label>
        <label><span>Account status</span><select value={status} onChange={(event) => { setStatus(event.target.value); resetPage(); }}><option value="">All accounts</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <label><span>Verification</span><select value={verification} onChange={(event) => { setVerification(event.target.value); resetPage(); }}><option value="">All verification</option><option value="VERIFIED">Verified</option><option value="UNVERIFIED">Unverified</option></select></label>
        <label><span>Location</span><input value={location} onChange={(event) => { setLocation(event.target.value); resetPage(); }} placeholder="Any location" /></label>
        <label><span>Sort by</span><select value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); resetPage(); }}><option value="createdAt">Joined date</option><option value="lastLogin">Last login</option><option value="applicationCount">Applications</option><option value="name">Name</option></select></label>
        <label><span>Order</span><select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as typeof sortOrder); resetPage(); }}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      </section>

      <section className="admin-real-seekers-workspace">
        <div className="admin-panel admin-real-seekers-list-panel" aria-live="polite">
          <div className="admin-section-heading"><div><span><FaUsers /> Seeker directory</span><h2>{pagination.total} seekers</h2></div></div>
          {isLoading ? <p className="admin-real-seekers-message">Loading seekers...</p> : null}
          {!isLoading && error ? <p className="admin-real-seekers-message admin-real-seekers-message--error">{error}</p> : null}
          {!isLoading && !error && seekers.length === 0 ? <p className="admin-real-seekers-message">No seekers match the selected filters.</p> : null}
          {!isLoading && !error && seekers.length > 0 ? <div className="admin-real-seekers-table-wrap"><table className="admin-real-seekers-table"><thead><tr><th>Seeker</th><th>Profile</th><th>Account</th><th>Applications</th></tr></thead><tbody>{seekers.map((seeker) => <tr className={selectedSeekerId === seeker.id ? 'admin-real-seeker-row--selected' : ''} key={seeker.id} onClick={() => setSelectedSeekerId(seeker.id)}><td><div className="admin-real-seeker-identity"><div className="admin-real-seeker-avatar">{initials(seeker)}</div><div><strong>{fullName(seeker)}</strong><span>{seeker.email}</span></div></div></td><td><strong>{seeker.profile?.professionalTitle || 'Title not provided'}</strong><span><FaMapMarkerAlt /> {seeker.profile?.location || 'Location not provided'}</span></td><td><div className="admin-real-seeker-status"><span className={`admin-status ${seeker.isActive ? 'admin-status--approved' : 'admin-status--declined'}`}>{seeker.isActive ? 'Active' : 'Inactive'}</span><small className={seeker.isVerified ? 'admin-real-seeker-verified' : 'admin-real-seeker-unverified'}>{seeker.isVerified ? 'Verified' : 'Unverified'}</small></div></td><td><strong>{seeker.applicationCount}</strong><span>applications</span></td></tr>)}</tbody></table></div> : null}
          {pagination.pages > 1 ? <div className="admin-real-seekers-pagination"><button className="admin-button admin-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="admin-button admin-button--secondary" type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div> : null}
        </div>

        {selectedSeeker ? <article className="admin-panel admin-real-seeker-detail"><div className="admin-real-seeker-detail__header"><div className="admin-real-seeker-identity"><div className="admin-real-seeker-avatar admin-real-seeker-avatar--large">{initials(selectedSeeker)}</div><div><span className="admin-review-kicker"><FaUsers /> Seeker profile</span><h2>{fullName(selectedSeeker)}</h2><p>{selectedSeeker.profile?.professionalTitle || 'Professional title not provided'}</p></div></div><div className="admin-real-seeker-status"><span className={`admin-status ${selectedSeeker.isActive ? 'admin-status--approved' : 'admin-status--declined'}`}>{selectedSeeker.isActive ? 'Active' : 'Inactive'}</span><small className={selectedSeeker.isVerified ? 'admin-real-seeker-verified' : 'admin-real-seeker-unverified'}>{selectedSeeker.isVerified ? 'Verified' : 'Unverified'}</small></div></div><div className="admin-real-seeker-facts"><div><span>Email</span><strong>{selectedSeeker.email}</strong></div><div><span>Phone</span><strong>{selectedSeeker.phone || 'Not provided'}</strong></div><div><span>Location</span><strong>{selectedSeeker.profile?.location || 'Not provided'}</strong></div><div><span>Applications</span><strong>{selectedSeeker.applicationCount}</strong></div><div><span>Joined</span><strong>{formatDate(selectedSeeker.createdAt)}</strong></div><div><span>Last login</span><strong>{formatDate(selectedSeeker.lastLogin)}</strong></div></div><section className="admin-real-seeker-section"><h3>Skills</h3>{selectedSeeker.profile?.skills.length ? <div className="admin-token-list">{selectedSeeker.profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : <p>Skills not provided.</p>}</section><section className="admin-real-seeker-cv"><FaFileAlt /><div><h3>Resume availability</h3><p>{selectedSeeker.profile?.hasResume ? 'Resume available' : 'No resume uploaded'}</p></div></section></article> : null}
      </section>
    </div>
  );
}

export default AdminSeekersPage;
