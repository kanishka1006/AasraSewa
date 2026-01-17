import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.role) {
            throw new UnauthorizedException('User role not found');
        }

        // Assuming user.role is actually the Role entity with a name property
        // If TypeORM didn't load relation, this breaks. 
        // The Strategy must ensure 'role' relation is loaded or role name is in JWT.
        const hasRole = requiredRoles.some((role) => user.role.name === role);
        if (!hasRole) {
            throw new ForbiddenException(`Requires roles: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
}
