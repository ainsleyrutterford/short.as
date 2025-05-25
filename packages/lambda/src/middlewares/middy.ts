/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MiddlewareContext<E = any, R = any> {
  event: E;
  context: any;
  internal: { cookiesToSet?: string[]; [key: string]: unknown };
  response: R | undefined;
  error: any | undefined;
}

export interface Middleware<E = any, R = any> {
  before?: (ctx: MiddlewareContext<E, R>) => undefined | Promise<undefined> | R | Promise<R>;
  after?: (ctx: MiddlewareContext<E, R>) => undefined | Promise<undefined> | R | Promise<R>;
  onError?: (ctx: MiddlewareContext<E, R>) => undefined | Promise<undefined> | R | Promise<R>;
}

export type MiddyHandler<E = any, R = any> = (event: E, context: any) => Promise<R>;

/**
 * A minimal implementation of a middy like middleware library. We've done this because middy
 * [currently doesn't work with LLRT](https://github.com/middyjs/middy/issues/1181).
 */
export function middy<E = any, R = any>() {
  const middlewares: Middleware<E, R>[] = [];

  const builder = {
    use(mw: Middleware<E, R>) {
      middlewares.push(mw);
      return builder;
    },

    handler(baseHandler: MiddyHandler<E, R>): MiddyHandler<E, R> {
      return async (event: E, context: any): Promise<R> => {
        const ctx: MiddlewareContext<E, R> = {
          event,
          context,
          internal: {},
          response: undefined,
          error: undefined,
        };

        for (const mw of middlewares) {
          if (mw.before) {
            const maybeResponse = await mw.before(ctx);
            if (maybeResponse) return maybeResponse;
          }
        }

        try {
          ctx.response = await baseHandler(ctx.event, ctx.context);

          for (const mw of middlewares) {
            if (mw.after) {
              const maybeResponse = await mw.after(ctx);
              if (maybeResponse) return maybeResponse;
            }
          }

          return ctx.response;
        } catch (err) {
          ctx.error = err;

          for (const mw of middlewares) {
            if (mw.onError) {
              const maybeResponse = await mw.onError(ctx);
              if (maybeResponse) return maybeResponse;
            }
          }

          throw ctx.error;
        }
      };
    },
  };

  return builder;
}
