import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the user object from the request.
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
