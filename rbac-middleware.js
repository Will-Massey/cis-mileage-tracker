/**
 * Role-Based Access Control (RBAC) Middleware
 * UK Business Mileage Tracking Web App
 * 
 * This module implements comprehensive RBAC with:
 * - Role hierarchy and inheritance
 * - Permission-based access control
 * - Resource ownership validation
 * - Accountant-user assignment
 * - Audit logging for access decisions
 * 
 * Security Features:
 * - Principle of least privilege
 * - Separation of duties
 * - Defense in depth
 * - Comprehensive audit trails
 */

// ============================================================================
// Role and Permission Definitions
// ============================================================================

/**
 * Role hierarchy (higher roles inherit lower role permissions)
 */
const ROLE_HIERARCHY = {
  admin: ['accountant', 'user'],      // Admin has all permissions
  accountant: ['user'],                // Accountant has user permissions
  user: []                             // User has base permissions only
};

/**
 * Permission definitions
 * Each permission has:
 * - action: The action being performed
 * - resource: The resource being accessed
 * - description: Human-readable description
 */
const PERMISSIONS = {
  // Trip permissions
  TRIP_CREATE: { action: 'create', resource: 'trip', description: 'Create new trips' },
  TRIP_READ_OWN: { action: 'read', resource: 'trip', scope: 'own', description: 'Read own trips' },
  TRIP_READ_ASSIGNED: { action: 'read', resource: 'trip', scope: 'assigned', description: 'Read assigned users trips' },
  TRIP_READ_ALL: { action: 'read', resource: 'trip', scope: 'all', description: 'Read all trips' },
  TRIP_UPDATE_OWN: { action: 'update', resource: 'trip', scope: 'own', description: 'Update own trips' },
  TRIP_UPDATE_ANY: { action: 'update', resource: 'trip', scope: 'any', description: 'Update any trip' },
  TRIP_DELETE_OWN: { action: 'delete', resource: 'trip', scope: 'own', description: 'Delete own trips' },
  TRIP_DELETE_ANY: { action: 'delete', resource: 'trip', scope: 'any', description: 'Delete any trip' },
  TRIP_EXPORT_OWN: { action: 'export', resource: 'trip', scope: 'own', description: 'Export own trips' },
  TRIP_EXPORT_ASSIGNED: { action: 'export', resource: 'trip', scope: 'assigned', description: 'Export assigned users trips' },
  TRIP_EXPORT_ALL: { action: 'export', resource: 'trip', scope: 'all', description: 'Export all trips' },

  // Vehicle permissions
  VEHICLE_CREATE: { action: 'create', resource: 'vehicle', description: 'Create vehicles' },
  VEHICLE_READ_OWN: { action: 'read', resource: 'vehicle', scope: 'own', description: 'Read own vehicles' },
  VEHICLE_READ_ANY: { action: 'read', resource: 'vehicle', scope: 'any', description: 'Read any vehicle' },
  VEHICLE_UPDATE_OWN: { action: 'update', resource: 'vehicle', scope: 'own', description: 'Update own vehicles' },
  VEHICLE_UPDATE_ANY: { action: 'update', resource: 'vehicle', scope: 'any', description: 'Update any vehicle' },
  VEHICLE_DELETE_OWN: { action: 'delete', resource: 'vehicle', scope: 'own', description: 'Delete own vehicles' },
  VEHICLE_DELETE_ANY: { action: 'delete', resource: 'vehicle', scope: 'any', description: 'Delete any vehicle' },

  // User permissions
  USER_READ_OWN: { action: 'read', resource: 'user', scope: 'own', description: 'Read own profile' },
  USER_READ_ANY: { action: 'read', resource: 'user', scope: 'any', description: 'Read any user profile' },
  USER_UPDATE_OWN: { action: 'update', resource: 'user', scope: 'own', description: 'Update own profile' },
  USER_UPDATE_ANY: { action: 'update', resource: 'user', scope: 'any', description: 'Update any user profile' },
  USER_DELETE_OWN: { action: 'delete', resource: 'user', scope: 'own', description: 'Delete own account' },
  USER_DELETE_ANY: { action: 'delete', resource: 'user', scope: 'any', description: 'Delete any user account' },
  USER_CREATE: { action: 'create', resource: 'user', description: 'Create new users' },
  USER_MANAGE_ROLES: { action: 'manage', resource: 'user_roles', description: 'Manage user roles' },
  USER_ASSIGN_ACCOUNTANT: { action: 'assign', resource: 'accountant', description: 'Assign accountants to users' },

  // Report permissions
  REPORT_CREATE_OWN: { action: 'create', resource: 'report', scope: 'own', description: 'Create own reports' },
  REPORT_CREATE_ASSIGNED: { action: 'create', resource: 'report', scope: 'assigned', description: 'Create reports for assigned users' },
  REPORT_CREATE_ANY: { action: 'create', resource: 'report', scope: 'any', description: 'Create any report' },
  REPORT_READ_OWN: { action: 'read', resource: 'report', scope: 'own', description: 'Read own reports' },
  REPORT_READ_ASSIGNED: { action: 'read', resource: 'report', scope: 'assigned', description: 'Read reports for assigned users' },
  REPORT_READ_ANY: { action: 'read', resource: 'report', scope: 'any', description: 'Read any report' },

  // Admin permissions
  ADMIN_ACCESS: { action: 'access', resource: 'admin_panel', description: 'Access admin panel' },
  SETTINGS_READ: { action: 'read', resource: 'settings', description: 'Read system settings' },
  SETTINGS_WRITE: { action: 'write', resource: 'settings', description: 'Modify system settings' },
  AUDIT_READ: { action: 'read', resource: 'audit_logs', description: 'Read audit logs' },
  SYSTEM_MANAGE: { action: 'manage', resource: 'system', description: 'Manage system' },

  // GDPR permissions
  DATA_EXPORT_OWN: { action: 'export', resource: 'personal_data', scope: 'own', description: 'Export own personal data' },
  DATA_EXPORT_ANY: { action: 'export', resource: 'personal_data', scope: 'any', description: 'Export any personal data' },
  DATA_DELETE_OWN: { action: 'delete', resource: 'personal_data', scope: 'own', description: 'Delete own personal data' },
  DATA_DELETE_ANY: { action: 'delete', resource: 'personal_data', scope: 'any', description: 'Delete any personal data' }
};

/**
 * Role to permissions mapping
 */
const ROLE_PERMISSIONS = {
  user: [
    // Trip permissions
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_READ_OWN,
    PERMISSIONS.TRIP_UPDATE_OWN,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.TRIP_EXPORT_OWN,
    
    // Vehicle permissions
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ_OWN,
    PERMISSIONS.VEHICLE_UPDATE_OWN,
    PERMISSIONS.VEHICLE_DELETE_OWN,
    
    // User permissions
    PERMISSIONS.USER_READ_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_DELETE_OWN,
    
    // Report permissions
    PERMISSIONS.REPORT_CREATE_OWN,
    PERMISSIONS.REPORT_READ_OWN,
    
    // GDPR permissions
    PERMISSIONS.DATA_EXPORT_OWN,
    PERMISSIONS.DATA_DELETE_OWN
  ],

  accountant: [
    // Inherit all user permissions
    ...ROLE_PERMISSIONS?.user || [],
    
    // Additional accountant permissions
    PERMISSIONS.TRIP_READ_ASSIGNED,
    PERMISSIONS.TRIP_EXPORT_ASSIGNED,
    PERMISSIONS.REPORT_CREATE_ASSIGNED,
    PERMISSIONS.REPORT_READ_ASSIGNED
  ],

  admin: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ]
};

// Fix circular reference - define accountant after user
ROLE_PERMISSIONS.accountant = [
  ...ROLE_PERMISSIONS.user,
  PERMISSIONS.TRIP_READ_ASSIGNED,
  PERMISSIONS.TRIP_EXPORT_ASSIGNED,
  PERMISSIONS.REPORT_CREATE_ASSIGNED,
  PERMISSIONS.REPORT_READ_ASSIGNED
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all permissions for a role (including inherited)
 * @param {string} role - Role name
 * @returns {Array} Array of permissions
 */
function getRolePermissions(role) {
  const permissions = new Set();
  
  // Add direct permissions
  const directPermissions = ROLE_PERMISSIONS[role] || [];
  directPermissions.forEach(p => permissions.add(p));
  
  // Add inherited permissions
  const inheritedRoles = ROLE_HIERARCHY[role] || [];
  for (const inheritedRole of inheritedRoles) {
    const inherited = getRolePermissions(inheritedRole);
    inherited.forEach(p => permissions.add(p));
  }
  
  return Array.from(permissions);
}

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with roles
 * @param {Object} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
function hasPermission(user, permission) {
  if (!user || !user.roles) {
    return false;
  }
  
  const userPermissions = new Set();
  
  for (const role of user.roles) {
    const rolePerms = getRolePermissions(role);
    rolePerms.forEach(p => userPermissions.add(p));
  }
  
  // Check if permission exists in user's permissions
  for (const userPerm of userPermissions) {
    if (userPerm.action === permission.action && 
        userPerm.resource === permission.resource &&
        (!permission.scope || userPerm.scope === permission.scope || userPerm.scope === 'any')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has any permission
 */
function hasAnyPermission(user, permissions) {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
function hasAllPermissions(user, permissions) {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user owns a resource
 * @param {Object} user - User object
 * @param {Object} resource - Resource to check
 * @param {string} ownerField - Field containing owner ID
 * @returns {boolean} True if user owns resource
 */
function isOwner(user, resource, ownerField = 'userId') {
  if (!user || !resource) {
    return false;
  }
  
  const ownerId = resource[ownerField] || resource.user_id || resource.userId;
  return ownerId === user.userId;
}

/**
 * Check if accountant is assigned to user
 * @param {Object} accountant - Accountant user object
 * @param {string} userId - User ID to check
 * @param {Object} db - Database connection
 * @returns {Promise<boolean>} True if assigned
 */
async function isAssignedAccountant(accountant, userId, db) {
  if (!accountant || !accountant.roles?.includes('accountant')) {
    return false;
  }
  
  // Check if user is in accountant's assigned users
  if (accountant.assignedUsers?.includes(userId)) {
    return true;
  }
  
  // Check database if not in memory
  if (db) {
    const result = await db.query(
      'SELECT 1 FROM user_accountant_assignments WHERE accountant_id = $1 AND user_id = $2 AND is_active = true',
      [accountant.userId, userId]
    );
    return result.rows.length > 0;
  }
  
  return false;
}

/**
 * Hash IP for logging
 * @param {string} ip - IP address
 * @returns {string} Hashed IP
 */
function hashIp(ip) {
  if (!ip) return null;
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(ip + (process.env.LOG_SALT || 'salt'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Log access decision for audit
 * @param {string} decision - 'allow' or 'deny'
 * @param {Object} details - Access details
 */
function logAccessDecision(decision, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'access_control',
    decision,
    ...details
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(`[RBAC] ${decision.toUpperCase()}:`, details.action, details.resource);
  }
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Middleware to check if user has required role
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      logAccessDecision('deny', {
        action: 'access',
        resource: req.path,
        reason: 'not_authenticated',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasAllowedRole) {
      logAccessDecision('deny', {
        userId: user.userId,
        action: 'access',
        resource: req.path,
        requiredRoles: allowedRoles,
        userRoles: user.roles,
        reason: 'insufficient_role',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_ROLE'
      });
    }
    
    logAccessDecision('allow', {
      userId: user.userId,
      action: 'access',
      resource: req.path,
      roles: user.roles
    });
    
    next();
  };
}

/**
 * Middleware to check if user has required permission
 * @param {Object} permission - Permission to check
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      logAccessDecision('deny', {
        action: permission.action,
        resource: permission.resource,
        reason: 'not_authenticated',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!hasPermission(user, permission)) {
      logAccessDecision('deny', {
        userId: user.userId,
        action: permission.action,
        resource: permission.resource,
        requiredPermission: permission,
        userRoles: user.roles,
        reason: 'missing_permission',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. Missing required permission.',
        code: 'MISSING_PERMISSION',
        requiredPermission: permission.description
      });
    }
    
    logAccessDecision('allow', {
      userId: user.userId,
      action: permission.action,
      resource: permission.resource
    });
    
    next();
  };
}

/**
 * Middleware to check if user has any of the required permissions
 * @param {...Object} permissions - Permissions to check
 * @returns {Function} Express middleware
 */
function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!hasAnyPermission(user, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Missing required permissions.',
        code: 'MISSING_PERMISSIONS'
      });
    }
    
    next();
  };
}

/**
 * Middleware to check resource ownership
 * @param {Function} getResource - Async function to fetch resource
 * @param {Object} options - Options
 * @returns {Function} Express middleware
 */
function requireOwnership(getResource, options = {}) {
  const { 
    ownerField = 'userId',
    paramName = 'id',
    allowAdmin = true,
    allowAccountant = false
  } = options;
  
  return async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Admins can access any resource
    if (allowAdmin && user.roles.includes('admin')) {
      return next();
    }
    
    try {
      const resourceId = req.params[paramName];
      const resource = await getResource(resourceId, req);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      // Check ownership
      if (isOwner(user, resource, ownerField)) {
        req.resource = resource;
        return next();
      }
      
      // Check accountant assignment
      if (allowAccountant && user.roles.includes('accountant')) {
        const ownerId = resource[ownerField] || resource.user_id || resource.userId;
        const isAssigned = await isAssignedAccountant(user, ownerId, req.app.locals.db);
        
        if (isAssigned) {
          req.resource = resource;
          return next();
        }
      }
      
      logAccessDecision('deny', {
        userId: user.userId,
        action: 'access',
        resource: req.path,
        resourceId,
        reason: 'not_owner',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to access this resource.',
        code: 'NOT_OWNER'
      });
      
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify resource ownership'
      });
    }
  };
}

/**
 * Middleware factory for trip access control
 * Handles the complex logic for trip visibility:
 * - Users can see their own trips
 * - Accountants can see assigned users' trips
 * - Admins can see all trips
 * @param {Object} options - Options
 * @returns {Function} Express middleware
 */
function requireTripAccess(options = {}) {
  const { requireWrite = false } = options;
  
  return async (req, res, next) => {
    const user = req.user;
    const db = req.app.locals.db;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    const tripId = req.params.id;
    
    try {
      // Fetch trip with owner info
      const result = await db.query(
        'SELECT id, user_id, status FROM trips WHERE id = $1',
        [tripId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        });
      }
      
      const trip = result.rows[0];
      
      // Admin can access all trips
      if (user.roles.includes('admin')) {
        req.trip = trip;
        return next();
      }
      
      // User can access their own trips
      if (trip.user_id === user.userId) {
        // For write operations, check if trip is editable
        if (requireWrite && trip.status === 'locked') {
          return res.status(403).json({
            success: false,
            error: 'Trip is locked and cannot be modified',
            code: 'TRIP_LOCKED'
          });
        }
        req.trip = trip;
        return next();
      }
      
      // Accountant can access assigned users' trips
      if (user.roles.includes('accountant')) {
        const isAssigned = await isAssignedAccountant(user, trip.user_id, db);
        
        if (isAssigned) {
          // Accountants can only read, not modify
          if (requireWrite) {
            return res.status(403).json({
              success: false,
              error: 'Accountants cannot modify trips',
              code: 'ACCOUNTANT_READ_ONLY'
            });
          }
          req.trip = trip;
          return next();
        }
      }
      
      logAccessDecision('deny', {
        userId: user.userId,
        action: requireWrite ? 'write' : 'read',
        resource: 'trip',
        resourceId: tripId,
        reason: 'no_access',
        ipAddress: hashIp(req.ip)
      });
      
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this trip',
        code: 'TRIP_ACCESS_DENIED'
      });
      
    } catch (error) {
      console.error('Trip access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify trip access'
      });
    }
  };
}

/**
 * Middleware to filter query results based on user access
 * Modifies the query to only return accessible records
 * @param {string} tableName - Database table name
 * @param {string} userIdColumn - Column containing user ID
 * @returns {Function} Express middleware
 */
function filterByAccess(tableName, userIdColumn = 'user_id') {
  return async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Build access filter
    let accessFilter = '';
    let accessParams = [];
    
    if (user.roles.includes('admin')) {
      // Admin sees all - no filter
      accessFilter = '';
    } else if (user.roles.includes('accountant')) {
      // Accountant sees own + assigned users' records
      const db = req.app.locals.db;
      const assignedResult = await db.query(
        'SELECT user_id FROM user_accountant_assignments WHERE accountant_id = $1 AND is_active = true',
        [user.userId]
      );
      const assignedUserIds = assignedResult.rows.map(r => r.user_id);
      assignedUserIds.push(user.userId);
      
      accessFilter = `${userIdColumn} = ANY($1)`;
      accessParams = [assignedUserIds];
    } else {
      // Regular user sees only own records
      accessFilter = `${userIdColumn} = $1`;
      accessParams = [user.userId];
    }
    
    // Attach filter to request for use in controller
    req.accessFilter = {
      where: accessFilter,
      params: accessParams
    };
    
    next();
  };
}

/**
 * Middleware to require admin access
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to require accountant or admin access
 */
const requireAccountantOrAdmin = requireRole('accountant', 'admin');

/**
 * Middleware to require authenticated user
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }
  next();
}

// ============================================================================
// Audit Logging Middleware
// ============================================================================

/**
 * Middleware to log access to sensitive resources
 * @param {string} resourceType - Type of resource being accessed
 */
function auditAccess(resourceType) {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Restore original method
      res.json = originalJson;
      
      // Log the access
      logAccessDecision(data.success ? 'allow' : 'deny', {
        userId: req.user?.userId,
        action: req.method,
        resource: resourceType,
        resourceId: req.params.id,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress: hashIp(req.ip)
      });
      
      return res.json(data);
    };
    
    next();
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Constants
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  
  // Role middleware
  requireRole,
  requireAdmin,
  requireAccountantOrAdmin,
  requireAuth,
  
  // Permission middleware
  requirePermission,
  requireAnyPermission,
  
  // Ownership middleware
  requireOwnership,
  requireTripAccess,
  filterByAccess,
  
  // Audit middleware
  auditAccess,
  
  // Helper functions
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isOwner,
  isAssignedAccountant,
  logAccessDecision
};
