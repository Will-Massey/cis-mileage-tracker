/**
 * Role-Based Access Control (RBAC) Middleware
 * Authorization based on user roles
 */

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = {
  user: 0,
  accountant: 1,
  admin: 2,
};

// Permission definitions
const PERMISSIONS = {
  // Trip permissions
  TRIP_CREATE: 'trip:create',
  TRIP_READ_OWN: 'trip:read:own',
  TRIP_READ_ASSIGNED: 'trip:read:assigned',
  TRIP_READ_ALL: 'trip:read:all',
  TRIP_UPDATE_OWN: 'trip:update:own',
  TRIP_UPDATE_ANY: 'trip:update:any',
  TRIP_DELETE_OWN: 'trip:delete:own',
  TRIP_DELETE_ANY: 'trip:delete:any',
  
  // Vehicle permissions
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_READ_OWN: 'vehicle:read:own',
  VEHICLE_READ_ALL: 'vehicle:read:all',
  VEHICLE_UPDATE_OWN: 'vehicle:update:own',
  VEHICLE_UPDATE_ANY: 'vehicle:update:any',
  VEHICLE_DELETE_OWN: 'vehicle:delete:own',
  VEHICLE_DELETE_ANY: 'vehicle:delete:any',
  
  // Report permissions
  REPORT_CREATE: 'report:create',
  REPORT_READ_OWN: 'report:read:own',
  REPORT_READ_ASSIGNED: 'report:read:assigned',
  REPORT_READ_ALL: 'report:read:all',
  REPORT_DELETE_OWN: 'report:delete:own',
  REPORT_DELETE_ANY: 'report:delete:any',
  
  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ_OWN: 'user:read:own',
  USER_READ_ALL: 'user:read:all',
  USER_UPDATE_OWN: 'user:update:own',
  USER_UPDATE_ANY: 'user:update:any',
  USER_DELETE_ANY: 'user:delete:any',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_AUDIT_LOGS: 'admin:audit:logs',
  ADMIN_STATS: 'admin:stats',
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  user: [
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_READ_OWN,
    PERMISSIONS.TRIP_UPDATE_OWN,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ_OWN,
    PERMISSIONS.VEHICLE_UPDATE_OWN,
    PERMISSIONS.VEHICLE_DELETE_OWN,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ_OWN,
    PERMISSIONS.REPORT_DELETE_OWN,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
  ],
  accountant: [
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_READ_OWN,
    PERMISSIONS.TRIP_READ_ASSIGNED,
    PERMISSIONS.TRIP_UPDATE_OWN,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ_OWN,
    PERMISSIONS.VEHICLE_UPDATE_OWN,
    PERMISSIONS.VEHICLE_DELETE_OWN,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ_OWN,
    PERMISSIONS.REPORT_READ_ASSIGNED,
    PERMISSIONS.REPORT_DELETE_OWN,
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
  ],
  admin: Object.values(PERMISSIONS), // Admin has all permissions
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role
 * @param {string} permission - Permission to check
 * @returns {boolean} Has permission
 */
const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions
 * @returns {boolean} Has any permission
 */
const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions
 * @returns {boolean} Has all permissions
 */
const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user role is at least the required role
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required minimum role
 * @returns {boolean} Has sufficient role
 */
const hasRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Middleware factory - require specific permission
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware factory - require any of the specified permissions
 * @param {Array} permissions - Array of allowed permissions
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware factory - require specific role or higher
 * @param {string} role - Required minimum role
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasRole(req.user.role, role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
      });
    }

    next();
  };
};

/**
 * Middleware - require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware - require accountant or admin role
 */
const requireAccountant = requireRole('accountant');

/**
 * Middleware - check if user can access specific trip
 * Users can only access their own trips
 * Accountants can access their own and assigned users' trips
 * Admins can access all trips
 */
const canAccessTrip = async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const tripId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access all
    if (user.role === 'admin') {
      return next();
    }

    // Get trip owner
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // User can access own trips
    if (trip.userId === user.id) {
      return next();
    }

    // Accountant can access assigned users' trips (future feature)
    if (user.role === 'accountant') {
      // TODO: Check if user is assigned to accountant
      // For now, deny access
      return res.status(403).json({
        success: false,
        message: 'Access denied to this trip',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this trip',
    });
  } catch (error) {
    console.error('Trip access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed',
    });
  }
};

/**
 * Middleware - check if user can access specific vehicle
 */
const canAccessVehicle = async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const vehicleId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access all
    if (user.role === 'admin') {
      return next();
    }

    // Get vehicle owner
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { userId: true },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // User can access own vehicles
    if (vehicle.userId === user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this vehicle',
    });
  } catch (error) {
    console.error('Vehicle access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed',
    });
  }
};

/**
 * Middleware - check if user can access specific report
 */
const canAccessReport = async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const reportId = req.params.id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access all
    if (user.role === 'admin') {
      return next();
    }

    // Get report owner
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { userId: true },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // User can access own reports
    if (report.userId === user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this report',
    });
  } catch (error) {
    console.error('Report access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed',
    });
  }
};

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireAdmin,
  requireAccountant,
  canAccessTrip,
  canAccessVehicle,
  canAccessReport,
};
