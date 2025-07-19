/**
 * A copy paste of the main file of the middy-lesslog library since we're
 * using a custom implementation of middy and lesslog at the moment as
 * LLRT doesn't have a lot of the Node APIs implemented
 *
 * https://github.com/robdasilva/middy-lesslog/blob/main/index.ts
 */

import { Middleware } from "./middy";
import { log } from "../lesslog";

function logError({ message, stack, ...details }: Error) {
  log.error(message, { error: { ...details, message, stack } });
}

export const lesslog = (): Middleware => {
  return {
    after({ error, response }) {
      log.debug("Response", { response });

      if (error) {
        logError(error);
      } else {
        log.clear();
      }

      log.label = "";
    },
    before({ context, event }) {
      log.label = context.awsRequestId;

      log.debug("Request", { context, event });
    },
    onError({ error }) {
      if (error) {
        logError(error);
      }

      log.label = "";
    },
  };
};
