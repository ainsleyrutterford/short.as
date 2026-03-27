import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { middy } from "../../src/middlewares/middy";
import { warmup } from "../../src/middlewares/warmup";

const emptyEvent = {} as APIGatewayProxyEventV2;
const emptyContext = {} as Context;

describe("warmup", () => {
  it("should return early for warming events", async () => {
    let handlerCalled = false;
    const handler = middy()
      .use(warmup())
      .handler(async () => {
        handlerCalled = true;
        return "should not reach";
      });

    const result = await handler({ ...emptyEvent, warming: true }, emptyContext);
    expect(result).toEqual({ body: "Warming event handled" });
    expect(handlerCalled).toBe(false);
  });

  it("should pass through for normal events", async () => {
    const handler = middy()
      .use(warmup())
      .handler(async () => "normal response");

    const result = await handler(emptyEvent, emptyContext);
    expect(result).toBe("normal response");
  });
});
