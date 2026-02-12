import { differenceInDays, differenceInSeconds, format, formatDistanceToNowStrict, isYesterday } from "date-fns";

export const smartDateString = (isoTimestamp?: string, lowercase = false) => {
  if (!isoTimestamp) return undefined;

  const now = new Date();
  const date = new Date(isoTimestamp);

  const secondsAgo = differenceInSeconds(now, date);
  const daysAgo = differenceInDays(now, date);

  if (secondsAgo <= 60) return lowercase ? "moments ago" : "Moments ago";

  if (isYesterday(date)) return lowercase ? "yesterday" : "Yesterday";

  // e.g. "3 hours ago" or "3 days ago"
  if (daysAgo < 7) return formatDistanceToNowStrict(date, { addSuffix: true });

  // e.g. "Jun 8, 2025"
  return format(date, "MMM d, yyyy");
};
