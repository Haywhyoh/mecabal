import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@app/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

@Injectable()
export class MarketplaceAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      console.log('🔓 Public endpoint, allowing access');
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Check if request is coming from API Gateway with user ID in headers
    const userIdFromGateway = request.headers['x-user-id'];

    if (userIdFromGateway) {
      // Fix UUID format if it has an extra character (common issue with JWT tokens)
      let fixedUserId = userIdFromGateway;
      if (userIdFromGateway.length === 37 && userIdFromGateway.endsWith('f')) {
        fixedUserId = userIdFromGateway.slice(0, -1); // Remove the trailing 'f'
      }

      // Request is coming from API Gateway, load user from database
      const user = await this.userRepository.findOne({
        where: { id: fixedUserId },
        relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Get primary neighborhood ID
      const primaryNeighborhood = user.userNeighborhoods?.[0]?.neighborhood?.id;

      // Attach user to request with required fields
      request.user = {
        userId: user.id,
        neighborhoodId: primaryNeighborhood || 'default-neighborhood-id', // TODO: Handle users without neighborhoods
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      return true;
    }

    // Fall back to JWT authentication for direct requests
    const jwtGuard = new (AuthGuard('jwt'))();
    const result = await jwtGuard.canActivate(context);

    if (result) {
      // JWT strategy returns the full User object, transform it for the controller
      const user = request.user;
      if (user && user.id) {
        const primaryNeighborhood = user.userNeighborhoods?.[0]?.neighborhood?.id;
        request.user = {
          userId: user.id,
          neighborhoodId: primaryNeighborhood || '00000000-0000-0000-0000-000000000001',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    }

    return result as boolean;
  }
}
