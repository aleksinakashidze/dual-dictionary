import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;       // user._id
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/** Extract the full JWT payload or a specific field from the request */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();
    return field ? request.user?.[field] : request.user;
  },
);
