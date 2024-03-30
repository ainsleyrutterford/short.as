/**
 * Redirects the following:
 * - https://tiny.mu/site -> https://tiny.mu/site/index.html
 * - https://tiny.mu/site/folder/ -> https://tiny.mu/site/folder/index.html
 * - https://tiny.mu/site/page -> https://tiny.mu/site/page.html
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
