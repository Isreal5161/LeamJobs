export const ADMIN_NAVIGATION_ITEMS = [
  { section: 'Main', label: 'Overview', to: '/admin/dashboard', icon: 'home', permissions: ['analytics.view', 'finance.payments.view', 'finance.contractFunding.view', 'fees.view'] },
  { section: 'Job management', label: 'Job Posts', to: '/admin/jobs', icon: 'briefcase', permissions: ['jobs.view'] },
  { section: 'Job management', label: 'Moderation', to: '/admin/moderation', icon: 'flag', permissions: ['jobs.view'] },
  { section: 'People', label: 'Users', to: '/admin/users', icon: 'user', permissions: ['users.view'] },
  { section: 'People', label: 'Companies', to: '/admin/companies', icon: 'building', permissions: ['companies.view'] },
  { section: 'People', label: 'Seekers', to: '/admin/seekers', icon: 'users', permissions: ['users.view'] },
  { section: 'Operations', label: 'Analytics', to: '/admin/analytics', icon: 'chart', permissions: ['analytics.view', 'finance.payments.view', 'finance.contractFunding.view', 'fees.view'] },
  { section: 'Operations', label: 'Payments', to: '/admin/payments', icon: 'money', permissions: ['finance.payments.view'] },
  { section: 'Operations', label: 'Withdrawal Monitoring', to: '/admin/withdrawals', icon: 'money', permissions: ['finance.withdrawals.view'] },
  { section: 'Operations', label: 'Contracts', to: '/admin/contracts', icon: 'fileContract', permissions: ['contracts.view', 'finance.contractFunding.view'] },
  { section: 'Operations', label: 'Subscriptions', to: '/admin/subscriptions', icon: 'crown', permissions: ['subscriptions.view'] },
  { section: 'Operations', label: 'Verifications', to: '/admin/verifications', icon: 'clipboard', permissions: ['verification.view'] },
  { section: 'Operations', label: 'Communications', to: '/admin/communications', icon: 'bullhorn', permissions: ['communications.templates.view', 'communications.campaigns.view'] },
  { section: 'Operations', label: 'Notifications', to: '/admin/notifications', icon: 'bell', permissions: ['notifications.view'] },
  { section: 'Content & tools', label: 'Page Content', to: '/admin/content', icon: 'edit', permissions: ['content.edit', 'content.publish'] },
  { section: 'Content & tools', label: 'Filters', to: '/admin/filters', icon: 'filter', permissions: ['jobs.view'] },
  { section: 'Content & tools', label: 'Recommendations', to: '/admin/recommendations', icon: 'star', permissions: ['jobs.view', 'users.view'] },
  { section: 'Administration', label: 'Staff Management', to: '/admin/staff', icon: 'users', superAdminOnly: true },
  { section: 'Administration', label: 'Settings', to: '/admin/settings', icon: 'cog', superAdminOnly: true },
];

export const ADMIN_HEADER_LINK_PATHS = [
  '/admin/dashboard',
  '/admin/moderation',
  '/admin/jobs',
  '/admin/users',
  '/admin/companies',
  '/admin/communications',
  '/admin/staff',
];

export const ADMIN_MOBILE_LINK_PATHS = [
  '/admin/dashboard',
  '/admin/jobs',
  '/admin/moderation',
  '/admin/users',
  '/admin/communications',
  '/admin/contracts',
  '/admin/withdrawals',
  '/admin/staff',
];

export const ADMIN_ACCOUNT_LINK_PATHS = [
  '/admin/content',
  '/admin/filters',
  '/admin/recommendations',
  '/admin/payments',
  '/admin/contracts',
  '/admin/withdrawals',
  '/admin/subscriptions',
  '/admin/verifications',
];

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseCurrentAdminPermissionsResponse = (payload) => {
  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) return null;

  const { tier, isSuperAdmin, permissions } = payload.data;
  if (!['SUPER_ADMIN', 'STAFF_ADMIN'].includes(tier)
    || isSuperAdmin !== (tier === 'SUPER_ADMIN')
    || !Array.isArray(permissions)
    || permissions.some((permission) => typeof permission !== 'string' || permission.trim() === '')) {
    return null;
  }

  return { tier, isSuperAdmin, permissions: [...new Set(permissions)] };
};

const isReadyState = (permissionState) => (
  permissionState?.status === 'ready'
  && (permissionState.data?.tier === 'SUPER_ADMIN' || permissionState.data?.tier === 'STAFF_ADMIN')
  && permissionState.data.isSuperAdmin === (permissionState.data.tier === 'SUPER_ADMIN')
  && Array.isArray(permissionState.data.permissions)
  && permissionState.data.permissions.every((permission) => typeof permission === 'string' && permission.trim() !== '')
);

export const hasAdminNavigationAccess = (permissionState, item) => {
  if (!isReadyState(permissionState) || !item) return false;
  if (permissionState.data.isSuperAdmin) return true;
  if (item.superAdminOnly || !Array.isArray(item.permissions) || item.permissions.length === 0) return false;

  const grantedPermissions = new Set(permissionState.data.permissions);
  return item.permissions.every((permission) => grantedPermissions.has(permission));
};

export const getVisibleAdminNavigationItems = (permissionState, paths = null) => {
  const filteredItems = ADMIN_NAVIGATION_ITEMS.filter((item) => (
    (!paths || paths.includes(item.to)) && hasAdminNavigationAccess(permissionState, item)
  ));

  return filteredItems;
};

export const getVisibleAdminNavigationSections = (permissionState) => {
  const visibleItems = getVisibleAdminNavigationItems(permissionState);
  const sections = [];

  for (const item of visibleItems) {
    let section = sections.find((candidate) => candidate.heading === item.section);
    if (!section) {
      section = { heading: item.section, items: [] };
      sections.push(section);
    }
    section.items.push(item);
  }

  return sections;
};

export const isAdminRouteAllowed = (pathname, permissionState) => {
  if (!isReadyState(permissionState)) return false;
  if (permissionState.data.isSuperAdmin) return true;

  const path = pathname.replace(/\/+$/, '') || '/admin';
  const navigationItem = ADMIN_NAVIGATION_ITEMS.find((item) => item.to === path);
  if (navigationItem) {
    if (path === '/admin/payments'
      && hasAdminNavigationAccess(permissionState, { permissions: ['fees.manage'] })) {
      return true;
    }
    return hasAdminNavigationAccess(permissionState, navigationItem);
  }

  if (path === '/admin') {
    return hasAdminNavigationAccess(
      permissionState,
      ADMIN_NAVIGATION_ITEMS.find((item) => item.to === '/admin/moderation'),
    );
  }
  if (/^\/admin\/jobs\/[^/]+\/applicants(?:\/[^/]+)?$/.test(path)) {
    return hasAdminNavigationAccess(permissionState, { permissions: ['applications.view'] });
  }
  if (/^\/admin\/contracts\/[^/]+$/.test(path)) {
    return hasAdminNavigationAccess(permissionState, { permissions: ['contracts.view', 'finance.contractFunding.view'] });
  }
  if (/^\/admin\/withdrawals\/[^/]+$/.test(path)) {
    return hasAdminNavigationAccess(permissionState, { permissions: ['finance.withdrawals.view'] });
  }

  return false;
};
