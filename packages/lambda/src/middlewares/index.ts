/**
 * Use:
 *
 * - https://middy.js.org/docs/middlewares/http-error-handler
 *   - with: https://www.npmjs.com/package/http-errors
 * - https://middy.js.org/docs/middlewares/warmup
 * - https://middy.js.org/docs/middlewares/error-logger
 * - Replace our custom router with: https://middy.js.org/docs/routers/http-router
 * - Use https://www.npmjs.com/package/middy-lesslog and switch a lot of our logging to debug instead!
 * - A custom middleware for our auth logic that adds the cookies if necessary. See ChatGPT.
 *
 * You can bundle these all into a single wrapper that we wrap our handlers with.
 */

export * from "./middy";
export * from "./warmup";
export * from "./auth";
export * from "./log-response";
