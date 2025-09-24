import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@app/auth';
import { IS_PUBLIC_KEY } from '@app/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';

@Injectable()
export class SocialAuthGuard extends JwtAuthGuard {
  constructor(
    reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Check if request is coming from API Gateway with user ID in headers
    const userIdFromGateway = request.headers['x-user-id'];
    
    if (userIdFromGateway) {
      // Request is coming from API Gateway, load user from database
      const user = await this.userRepository.findOne({
        where: { id: userIdFromGateway },
        relations: ['userNeighborhoods', 'userNeighborhoods.neighborhood'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Attach user to request
      request.user = user;
      return true;
    }

    // Fall back to JWT authentication for direct requests
    return await super.canActivate(context);
  }
}
