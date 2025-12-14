const fetch = (apiPath: string, init?: RequestInit) =>
  window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${apiPath}`, {
    // Necessary to send cookies
    credentials: "include",
    ...init,
  });

export const shortAsClient = { fetch };
