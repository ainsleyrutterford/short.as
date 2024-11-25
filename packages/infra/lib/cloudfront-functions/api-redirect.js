/**
 * Redirects https://short.as/api/* to APIGateway/* so that the API Gateway routes are called
 * correctly without the /api prefix
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  // Strip the '/api' prefix
  request.uri = request.uri.replace(/^\/api/, "");
  return request;
}
