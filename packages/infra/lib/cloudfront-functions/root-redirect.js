/**
 * Redirects the following:
 * - https://short.as/ -> https://short.as/create so that CloudFront redirects to the S3 website
 * - https://short.as/aaaaaaa/ -> https://short.as/aaaaaaa so that CloudFront calls the `get-long-url` API correctly
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  const host = request.headers.host.value;
  // TODO: when we update the CloudFront distribution so that S3 is the default,
  // TODO: this can be changed to just /create
  const newUrl = `https://${host}/create/shorten`;

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
