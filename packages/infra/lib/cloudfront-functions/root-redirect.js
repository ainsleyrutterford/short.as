/**
 * Redirects the following:
 * - https://short.as/ -> https://short.as/create so that CloudFront redirects to the S3 website
 * - https://short.as/aaaaaaa/ -> https://short.as/aaaaaaa so that CloudFront calls the `get-long-url` API correctly
 * - https://short.as/some-value -> https://short.as/create/some-value (if some-value is not of length 7 or contains
 * something other than lower and uppercase letters) so that CloudFront redirects to the S3 website
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  const host = request.headers.host.value;
  const websitePrefix = "create";

  if (request.uri === "/") {
    return {
      statusCode: 302,
      statusDescription: "Found",
      // TODO: when we update the CloudFront distribution so that S3 is the default,
      // TODO: this can be changed to just /shorten
      headers: { location: { value: `https://${host}/${websitePrefix}/shorten` } },
    };
  }

  if (request.uri.endsWith("/")) {
    request.uri = request.uri.slice(0, -1);
  }

  // Short URL IDs are of length 7 and contain only lower and uppercase letters,
  // so we redirect any differently shaped URIs to the S3 website. Note that the
  // redirect URI starts with a "/" so we expect that before the 7 characters.
  if (!/^\/[A-Za-z]{7}$/.test(request.uri)) {
    return {
      statusCode: 302,
      statusDescription: "Found",
      headers: { location: { value: `https://${host}/${websitePrefix}${request.uri}` } },
    };
  }

  return request;
}
