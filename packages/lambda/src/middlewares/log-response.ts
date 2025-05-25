import { Middleware } from "./middy";

export const logResponse = (): Middleware => ({
  after: async (request) => {
    if (request.response) console.log(`Returning response: ${JSON.stringify(request.response)}`);
  },
});
