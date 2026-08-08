import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AccessTokenPayload } from '../modules/auth/access-token-payload';
import { RequestContextStore } from './request-context';

interface RequestWithOptionalUser {
  user?: AccessTokenPayload;
}

/**
 * Global interceptor (registered via APP_INTERCEPTOR, so it also covers
 * e2e tests - same reasoning as the ValidationPipe/cookie-parser wiring
 * elsewhere in AppModule). Runs after guards, so request.user is already
 * populated for authenticated routes; unauthenticated routes (signup,
 * login) just get a null actor/school context.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOptionalUser>();

    return new Observable((subscriber) => {
      RequestContextStore.run(
        {
          schoolId: request.user?.schoolId ?? null,
          actorPersonId: request.user?.sub ?? null,
        },
        () => {
          next.handle().subscribe(subscriber);
        },
      );
    });
  }
}
