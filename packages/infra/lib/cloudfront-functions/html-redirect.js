/**
 * Redirects the following:
 * - https://short.as/site -> https://short.as/site/index.html
 * - https://short.as/site/folder/ -> https://short.as/site/folder/index.html
 * - https://short.as/site/page -> https://short.as/site/page.html
 */
async function handler(event) {
  const request = event.request;

  if (request.uri === '/site') {
    request.uri += '/index.html';
  } else if (request.uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!request.uri.includes('.')) {
    request.uri += '.html';
  }

  return request;
}
