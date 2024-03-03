const createShortUrl = (longUrl: string) => {
};

const serveLongUrlRedirect = (shortUrl: string) => {
  // Fetch the long URL from the cache (Redis) or DynamoDB. Look into types of caching for DynamoDB. (Look out for pricing!)
  // Return a 302 response to the long URL
};
