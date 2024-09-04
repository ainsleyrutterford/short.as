/**
 * Redirects the following:
 * - https://short.as/create -> https://short.as/create/index.html
 * - https://short.as/create/folder/ -> https://short.as/create/folder/index.html
 * - https://short.as/create/page -> https://short.as/create/page.html
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;

  if (request.uri === "/create") {
    request.uri += "/index.html";
  } else if (request.uri.endsWith("/")) {
    request.uri += "index.html";
  } else if (!request.uri.includes(".")) {
    request.uri += ".html";
  }

  return request;
}
