import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db.js';
import { UserRole } from '../src/types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbus-ai-ksrtc-secret-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    depot_id?: string;
  };
}

export function normalizeUserRole(role?: string): string {
  return (role || '').toLowerCase().trim();
}

export function generateToken(payload: { id: string; email: string; role: UserRole; name: string; depot_id?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const tokenUser = decoded as any;
    // Enrich with database state to ensure latest depot_id and role
    const dbUser = dbStore.getUsers().find(u => u.id === tokenUser.id);
    req.user = {
      id: tokenUser.id,
      email: tokenUser.email,
      role: (dbUser?.role || tokenUser.role) as UserRole,
      name: tokenUser.name,
      depot_id: dbUser?.depot_id || tokenUser.depot_id
    };
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      const tokenUser = decoded as any;
      const dbUser = dbStore.getUsers().find(u => u.id === tokenUser.id);
      req.user = {
        id: tokenUser.id,
        email: tokenUser.email,
        role: (dbUser?.role || tokenUser.role) as UserRole,
        name: tokenUser.name,
        depot_id: dbUser?.depot_id || tokenUser.depot_id
      };
    }
    next();
  });
}

export const requireAuth = authenticateToken;

/**
 * Require specific role(s). Case-insensitive check supporting both
 * 'DEPOT_MANAGER' and 'depot_manager', 'DRIVER' and 'driver', etc.
 */
export function requireRole(...allowedRoles: (UserRole | string)[]) {
  const normalizedAllowed = allowedRoles.map(r => normalizeUserRole(r));

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticateToken(req, res, () => {
      const userRole = normalizeUserRole(req.user?.role);
      if (!normalizedAllowed.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied: Required role (${allowedRoles.join(' or ')}) not met.`
        });
      }
      next();
    });
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (normalizeUserRole(req.user?.role) !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    next();
  });
}

export function requireDepotManager(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (normalizeUserRole(req.user?.role) !== 'depot_manager') {
      return res.status(403).json({ error: 'Access denied: DEPOT_MANAGER role required' });
    }
    next();
  });
}

export function requireDriver(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const role = normalizeUserRole(req.user?.role);
    if (role !== 'driver' && role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: DRIVER role required' });
    }
    next();
  });
}

export function requireDepotManagerOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const role = normalizeUserRole(req.user?.role);
    if (role !== 'depot_manager' && role !== 'admin') {
      return res.status(403).json({ error: 'Depot Manager or Admin access required' });
    }
    next();
  });
}

export function requireDriverOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const role = normalizeUserRole(req.user?.role);
    if (role !== 'driver' && role !== 'admin') {
      return res.status(403).json({ error: 'Driver or Admin access required' });
    }
    next();
  });
}

export interface DepotRouteAccessOptions {
  allowAdmin?: boolean;
}

/**
 * Middleware ensuring only DEPOT_MANAGER can access bus and route management
 * routes for their specific assigned depot (with optional Admin access).
 * Can be used directly as middleware: router.use(requireDepotManagerForAssignedDepot)
 * or as a factory: router.use(requireDepotManagerForAssignedDepot({ allowAdmin: false }))
 */
export function requireDepotManagerForAssignedDepot(
  optionsOrReq?: DepotRouteAccessOptions | AuthRequest,
  resOrNext?: Response | NextFunction,
  maybeNext?: NextFunction
): any {
  // Check if called directly as an Express middleware: (req, res, next)
  if (resOrNext && typeof (resOrNext as any) === 'object' && typeof maybeNext === 'function') {
    const req = optionsOrReq as AuthRequest;
    const res = resOrNext as Response;
    const next = maybeNext as NextFunction;
    const handler = createDepotManagerMiddleware({ allowAdmin: true });
    return handler(req, res, next);
  }

  // Otherwise called as factory: requireDepotManagerForAssignedDepot(options)
  const options = (optionsOrReq && !('method' in (optionsOrReq as any)))
    ? (optionsOrReq as DepotRouteAccessOptions)
    : { allowAdmin: true };

  return createDepotManagerMiddleware(options);
}

function createDepotManagerMiddleware(options: DepotRouteAccessOptions = { allowAdmin: true }) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticateToken(req, res, () => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication token required' });
      }

      const role = normalizeUserRole(user.role);

      // If admin is allowed and user is admin
      if (options.allowAdmin && role === 'admin') {
        return next();
      }

      // Must have DEPOT_MANAGER role
      if (role !== 'depot_manager') {
        return res.status(403).json({
          error: 'Access denied: Only DEPOT_MANAGER can access bus and route management routes'
        });
      }

      // Depot Manager must have an assigned depot_id
      const assignedDepotId = user.depot_id;
      if (!assignedDepotId) {
        return res.status(403).json({
          error: 'Access denied: No depot assigned to this DEPOT_MANAGER'
        });
      }

      // Determine target depot from route parameters, body, or query
      let targetDepotId: string | undefined =
        req.params.depotId ||
        req.params.id ||
        req.body?.depot_id ||
        (req.query?.depot_id as string | undefined);

      // If a busId is present in params or body, verify which depot the bus belongs to
      const busId = req.params.busId || req.body?.bus_id;
      if (busId) {
        const bus = dbStore.getBuses().find(b => b.id === busId);
        if (bus) {
          if (!targetDepotId) {
            targetDepotId = bus.depot_id;
          } else if (bus.depot_id && bus.depot_id !== targetDepotId) {
            return res.status(400).json({
              error: 'Invalid request: Target bus does not belong to the specified depot'
            });
          }

          if (bus.depot_id && bus.depot_id !== assignedDepotId) {
            return res.status(403).json({
              error: 'Access denied: You can only manage buses and routes for your specific assigned depot'
            });
          }
        }
      }

      // If a routeId is present in params or body, verify which depot the route's bus belongs to
      const routeId = req.params.routeId || req.body?.route_id;
      if (routeId) {
        const route = dbStore.getRoutes().find(r => r.id === routeId);
        if (route?.bus_id) {
          const bus = dbStore.getBuses().find(b => b.id === route.bus_id);
          if (bus) {
            if (!targetDepotId) {
              targetDepotId = bus.depot_id;
            } else if (bus.depot_id && bus.depot_id !== targetDepotId) {
              return res.status(400).json({
                error: 'Invalid request: Target route does not belong to the specified depot'
              });
            }

            if (bus.depot_id && bus.depot_id !== assignedDepotId) {
              return res.status(403).json({
                error: 'Access denied: You can only manage buses and routes for your specific assigned depot'
              });
            }
          }
        }
      }

      // Verify that the requested depot matches the manager's assigned depot
      if (targetDepotId && targetDepotId !== assignedDepotId) {
        return res.status(403).json({
          error: 'Access denied: You can only manage buses and routes for your specific assigned depot'
        });
      }

      // Prevent assigning new buses or assets to other depots via request body
      if (req.body?.depot_id && req.body.depot_id !== assignedDepotId) {
        return res.status(403).json({
          error: 'Access denied: Cannot assign or modify assets for another depot'
        });
      }

      next();
    });
  };
}

// Convenience export instances
export const requireDepotManagerAssignedDepot = requireDepotManagerForAssignedDepot({ allowAdmin: true });
export const requireOnlyDepotManagerForAssignedDepot = requireDepotManagerForAssignedDepot({ allowAdmin: false });
export const requireDepotManagerForDepot = requireDepotManagerAssignedDepot;
