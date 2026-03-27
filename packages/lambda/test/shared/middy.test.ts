import { middy } from "../../src/middlewares/middy";

describe("middy", () => {
  it("should call handler and return response", async () => {
    const handler = middy().handler(async () => "ok");
    expect(await handler({}, {})).toBe("ok");
  });

  it("should run before, handler, and after in correct order", async () => {
    const order: number[] = [];
    const handler = middy()
      .use({
        before: async () => {
          order.push(1);
        },
      })
      .use({
        before: async () => {
          order.push(2);
        },
      })
      .use({
        after: async () => {
          order.push(4);
        },
      })
      .use({
        after: async () => {
          order.push(5);
        },
      })
      .handler(async () => {
        order.push(3);
        return "ok";
      });

    await handler({}, {});
    expect(order).toEqual([1, 2, 3, 4, 5]);
  });

  it("should short-circuit when before middleware returns a response", async () => {
    let handlerCalled = false;
    const handler = middy()
      .use({ before: async () => "early" })
      .handler(async () => {
        handlerCalled = true;
        return "should not reach";
      });

    expect(await handler({}, {})).toBe("early");
    expect(handlerCalled).toBe(false);
  });

  it("should allow after middleware to short-circuit with a different response", async () => {
    const handler = middy()
      .use({ after: async () => "replaced" })
      .handler(async () => "original");

    expect(await handler({}, {})).toBe("replaced");
  });

  it("should call onError when handler throws", async () => {
    const handler = middy()
      .use({ onError: async () => "recovered" })
      .handler(async () => {
        throw new Error("boom");
      });

    expect(await handler({}, {})).toBe("recovered");
  });

  it("should rethrow if no onError middleware handles the error", async () => {
    const handler = middy().handler(async () => {
      throw new Error("boom");
    });
    await expect(handler({}, {})).rejects.toThrow("boom");
  });

  it("should attach originalErr when onError itself throws", async () => {
    const handler = middy()
      .use({
        onError: async () => {
          throw new Error("onError boom");
        },
      })
      .handler(async () => {
        throw new Error("original boom");
      });

    const error = await handler({}, {}).catch((e: Error & { originalErr: Error }) => e);
    expect(error.message).toBe("onError boom");
    expect(error.originalErr.message).toBe("original boom");
  });

  it("should pass event and context through middleware context", async () => {
    let capturedEvent: unknown;
    const handler = middy()
      .use({
        before: async (ctx) => {
          capturedEvent = ctx.event;
        },
      })
      .handler(async () => "ok");

    await handler({ test: true }, {});
    expect(capturedEvent).toEqual({ test: true });
  });

  it("should allow before middleware to modify the event for the handler", async () => {
    interface TestEvent {
      injected?: boolean;
    }
    const handler = middy<TestEvent>()
      .use({
        before: async (ctx) => {
          ctx.event.injected = true;
        },
      })
      .handler(async (event) => event.injected);

    expect(await handler({}, {})).toBe(true);
  });

  it("should share internal state between before and after middleware", async () => {
    interface Result {
      fromInternal?: number;
    }
    const handler = middy<unknown, Result>()
      .use({
        before: async (ctx) => {
          ctx.internal.value = 42;
        },
        after: async (ctx) => {
          if (ctx.response) ctx.response.fromInternal = ctx.internal.value as number;
        },
      })
      .handler(async () => ({}));

    const result = await handler({}, {});
    expect(result?.fromInternal).toBe(42);
  });
});
