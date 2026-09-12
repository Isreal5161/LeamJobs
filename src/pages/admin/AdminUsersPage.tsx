import { useEffect, useState } from 'react';
import { FaSearch, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminUsers, type AdminUser } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const PAGE_SIZE = 20;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : 'Never';

const roleLabel = (role: AdminUser['role']) => role === 'SEEKER' ? 'Job seeker' : role === 'EMPLOYER' ? 'Employer' : 'Admin';

function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadUsers = async () => {
      setIsLoading(true);
      setError('');
      const result = await getAdminUsers(token, {
        page,
        limit: PAGE_SIZE,
        search,
        role: role ? role as AdminUser['role'] : undefined,
        status: status as 'ACTIVE' | 'INACTIVE' | 'VERIFIED' | 'UNVERIFIED' | 'ALL',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load users.');
        setUsers([]);
        setIsLoading(false);
        return;
      }

      setUsers(result.data.data.users);
      setPagination(result.data.data.pagination);
      setIsLoading(false);
    };

    void loadUsers();
    return () => { active = false; };
  }, [token, page, search, role, status]);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow"><FaUsers /> Account administration</span>
          <h1>Users</h1>
          <p>Review registered accounts, profile summaries, and account verification at a glance.</p>
        </div>
      </section>

      <section className="admin-panel admin-users-toolbar" aria-label="User filters">
        <label className="admin-users-search">
          <span>Search users</span>
          <span className="admin-users-search__input"><FaSearch /><input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Name or email" /></span>
        </label>
        <label>
          <span>Role</span>
          <select value={role} onChange={(event) => updateFilter(setRole, event.target.value)}>
            <option value="">All roles</option>
            <option value="SEEKER">Job seekers</option>
            <option value="EMPLOYER">Employers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)}>
            <option value="ALL">All accounts</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </label>
      </section>

      <section className="admin-panel admin-users-list" aria-live="polite">
        <div className="admin-section-heading">
          <div>
            <span><FaUsers /> Registered accounts</span>
            <h2>{pagination.total} total users</h2>
          </div>
        </div>

        {isLoading ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={4} /> : null}
        {!isLoading && error ? <p className="admin-users-message admin-users-message--error">{error}</p> : null}
        {!isLoading && !error && users.length === 0 ? <p className="admin-users-message">No users match the selected filters.</p> : null}

        {!isLoading && !error && users.length > 0 ? (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Profile summary</th><th>Joined</th><th>Last login</th></tr></thead>
              <tbody>{users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></td>
                  <td><span className="admin-status admin-status--role">{roleLabel(user.role)}</span></td>
                  <td><div className="admin-users-status"><span className={`admin-status ${user.isActive ? 'admin-status--approved' : 'admin-status--declined'}`}>{user.isActive ? 'Active' : 'Inactive'}</span><small>{user.isVerified ? 'Verified' : 'Unverified'}</small></div></td>
                  <td>{user.profile?.companyName || user.profile?.professionalTitle || 'Profile not completed'}<span>{user.profile?.location || 'Location not provided'}</span></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : null}

        {pagination.pages > 1 ? <div className="admin-users-pagination"><button className="admin-button admin-button--secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="admin-button admin-button--secondary" type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div> : null}
      </section>
    </div>
  );
}

export default AdminUsersPage;