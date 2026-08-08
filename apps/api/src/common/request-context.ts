import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  schoolId: string | null;
  actorPersonId: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Set once per request by RequestContextInterceptor (after JwtAuthGuard has
 * populated request.user), read by AuditService/AuditSubscriber - this is
 * how an audit log row knows who did it and which tenant it happened in,
 * without threading an actor argument through every service method.
 */
export const RequestContextStore = {
  run<T>(context: RequestContext, callback: () => T): T {
    return storage.run(context, callback);
  },
  get(): RequestContext | undefined {
    return storage.getStore();
  },
};
