import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from './access-token-payload';

interface RequestWithUser {
  user: AccessTokenPayload;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
