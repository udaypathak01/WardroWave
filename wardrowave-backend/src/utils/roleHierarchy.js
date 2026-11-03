const roleRank = Object.freeze({
  customer: 0,
  staff: 1,
  admin: 2,
  superadmin: 3,
});

export function hasRoleAtLeast(role, minimumRole) {
  return Number.isInteger(roleRank[role])
    && Number.isInteger(roleRank[minimumRole])
    && roleRank[role] >= roleRank[minimumRole];
}

export function isAdminRole(role) {
  return hasRoleAtLeast(role, 'admin');
}

export function isPrivilegedRole(role) {
  return role === 'admin' || role === 'superadmin';
}

export function isRoleDemotion(previousRole, nextRole) {
  return previousRole !== nextRole && hasRoleAtLeast(previousRole, nextRole);
}
