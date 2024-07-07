/**
 * Redirects the following:
 * - https://short.as/ -> https://short.as/site/ so that CloudFront redirects to the S3 website
 * - https://short.as/aaaaaaa/ -> https://short.as/aaaaaaa so that CloudFront calls the `get-long-url` API correctly
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  const host = request.headers.host.value;
  const newUrl = `https://${host}/site/`;

  if (request.uri === "/") {
    return {
      statusCode: 302,
      statusDescription: "Found",
      headers: { location: { value: newUrl } },
    };
  } else if (request.uri.endsWith("/")) {
    request.uri = request.uri.slice(0, -1);
  }

  return request;
}
