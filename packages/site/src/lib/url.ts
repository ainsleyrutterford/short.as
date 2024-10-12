/**
 * Attempts to create a URL object with the `url`. If successful, the original `url` is returned,
 * otherwise an error is thrown.
 */
const validateUrl = (url: string) => {
  new URL(url);
  return url;
};

/**
 * Checks if the URL is valid as is, and also checks if the URL would be valid if
 * the `https://` protocol was prepended to it.
 * @param url the URL to check.
 * @returns a valid URL that could be the original URL or could have the `https://` protocol
 * prepended to it. If the URL is not and cannot be made valid, `undefined` is returned.
 */
export const getValidUrl = (url: string): string | undefined => {
  url = url.trim();
  try {
    return validateUrl(url);
  } catch {
    try {
      return validateUrl(`https://${url}`);
    } catch {
      return undefined;
    }
  }
};
