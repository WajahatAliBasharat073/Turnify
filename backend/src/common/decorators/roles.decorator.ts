import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';

export const ROLES_KEY = 'roles';
/**
 * Decorator to restrict access to specific user roles.
 * @param roles List of allowed roles
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
