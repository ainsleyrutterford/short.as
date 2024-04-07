/**
 * Redirects the following:
 * - https://tiny.mu/ -> https://tiny.mu/site/ so that CloudFront redirects to the S3 website
 * - https://tiny.mu/aaaaaaa/ -> https://tiny.mu/aaaaaaa so that CloudFront calls the `get-long-url` API correctly
 */
async function handler(event) {
  const request = event.request;
  const host = request.headers.host.value;
  const newurl = `https://${host}/site/`;

  if (request.uri === '/') {
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: { location: { value: newurl } },
    };
  } else if (request.uri.endsWith('/')) {
    request.uri = request.uri.slice(0, -1);
  }

  return request;
}
