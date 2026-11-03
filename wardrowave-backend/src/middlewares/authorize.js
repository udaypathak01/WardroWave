import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { isAdminRole, isPrivilegedRole } from '../utils/roleHierarchy.js';

function logSecurityDenial(req, event, details = {}) {
  logger.info({
    event,
    requestId: req.id,
    userId: req.user?._id?.toString(),
    ...details,
  }, 'Admin security gate rejected request');
}

/**
 * Restricts a route to users whose role matches one of the allowed values.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const allowed = allowedRoles.some((role) => (
      role === 'admin'
        ? isAdminRole(req.user?.role)
        : role === 'staff'
          ? ['staff', 'admin', 'superadmin'].includes(req.user?.role)
          : req.user?.role === role
    ));
    if (!allowed) {
      if (req.originalUrl?.includes('/admin/') || req.originalUrl?.includes('/staff/')) {
        logSecurityDenial(req, 'admin.authorization_denied', { role: req.user?.role });
      }
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  };
}

export function requireVerifiedAdmin(req, res, next) {
  if (!isAdminRole(req.user?.role) || req.firebaseUser?.email_verified !== true) {
    logSecurityDenial(req, 'admin.verified_email_required', { role: req.user?.role });
    return next(new ApiError(403, 'A verified email is required for administrator access'));
  }
  next();
}

export function requireVerifiedAdminWhenPresent(req, res, next) {
  if (isAdminRole(req.user?.role) && req.firebaseUser?.email_verified !== true) {
    logSecurityDenial(req, 'admin.verified_email_required', { role: req.user?.role });
    return next(new ApiError(403, 'A verified email is required for administrator access'));
  }
  next();
}

export function requireRecentAuth(req, res, next) {
  const authTime = req.firebaseUser?.auth_time;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(authTime)
    || authTime > nowSeconds + 60
    || nowSeconds - authTime > env.ADMIN_REAUTH_MAX_AGE_SECONDS
  ) {
    logSecurityDenial(req, 'REAUTH_REQUIRED', {
      maxAgeSeconds: env.ADMIN_REAUTH_MAX_AGE_SECONDS,
    });
    return next(new ApiError(
      401,
      'Please sign in again to continue this sensitive action',
      'REAUTH_REQUIRED',
      { maxAgeSeconds: env.ADMIN_REAUTH_MAX_AGE_SECONDS }
    ));
  }
  next();
}

export function requireMfa(req, res, next) {
  if (
    env.ADMIN_REQUIRE_MFA
    && typeof req.firebaseUser?.firebase?.sign_in_second_factor !== 'string'
  ) {
    logSecurityDenial(req, 'MFA_REQUIRED');
    return next(new ApiError(403, 'Multi-factor authentication is required', 'MFA_REQUIRED'));
  }
  next();
}

export function requireSuperadmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    logSecurityDenial(req, 'admin.superadmin_required', { role: req.user?.role });
    return next(new ApiError(403, 'Superadministrator access is required'));
  }
  next();
}

export function requireUserAccessTier(req, res, next) {
  const criticalRoleChange = req.body?.role !== undefined;
  const continueAtSensitiveTier = () => requireRecentAuth(req, res, next);
  const continueAtCriticalTier = () => {
    if (req.user?.role !== 'superadmin') {
      logSecurityDenial(req, 'admin.superadmin_required', { role: req.user?.role });
      return next(new ApiError(403, 'Superadministrator access is required'));
    }
    requireRecentAuth(req, res, (error) => {
      if (error) return next(error);
      requireMfa(req, res, next);
    });
  };

  if (criticalRoleChange) return continueAtCriticalTier();
  if (req.body?.status !== undefined) {
    User.findById(req.params.id).select('role').lean().exec()
      .then((target) => {
        if (target && isPrivilegedRole(target.role)) return continueAtCriticalTier();
        return continueAtSensitiveTier();
      })
      .catch(next);
    return;
  }
  return continueAtSensitiveTier();
}
