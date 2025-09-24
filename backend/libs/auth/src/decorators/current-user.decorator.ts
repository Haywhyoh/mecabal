import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@app/database';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest() as { user: User };
    return request.user;
  },
);
