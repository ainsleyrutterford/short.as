import React from "react";
import { Check, CopyIcon, MousePointerClickIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { isProd } from "@/lib/utils";
// import { ShareMenu } from "./share-menu";
import useSWR from "swr";
import { Url } from "@short-as/types";
import { differenceInDays, differenceInSeconds, format, formatDistanceToNow, isYesterday } from "date-fns";
import { QRCodeDrawerDialog } from "./qr-code";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_URLS_KEY } from "@/lib/swr";

const smartDateString = (isoTimestamp?: string) => {
  if (!isoTimestamp) return undefined;

  const now = new Date();
  const date = new Date(isoTimestamp);

  const secondsAgo = differenceInSeconds(now, date);
  const daysAgo = differenceInDays(now, date);

  if (secondsAgo <= 30) return "moments ago";

  // e.g. "3 hours ago"
  if (daysAgo < 1) return formatDistanceToNow(date, { addSuffix: true });

  // TODO: this doesn't seem to be working right
  if (isYesterday(date)) return "yesterday";

  // e.g. "3 days ago"
  if (daysAgo < 7) return formatDistanceToNow(date, { addSuffix: true });

  // e.g. "Jun 8, 2025"
  return format(date, "MMM d, yyyy");
};

const DateTime = ({ isoTimestamp }: { isoTimestamp?: string }) => (
  <span title={format(isoTimestamp ?? "", "PPpp")}>{smartDateString(isoTimestamp)}</span>
);

const fetcher = async (url: string) => {
  const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
    method: "GET",
    // Necessary to send cookies
    credentials: "include",
  });
  const urls = (await data.json()) as Url[];
  return urls.sort((a, b) => (a.createdTimestamp < b.createdTimestamp ? 1 : -1));
};

interface UrlCardProps {
  url?: Url;
}

const UrlCard = ({ url }: UrlCardProps) => {
  const loading = url === undefined;
  const { shortUrlId, longUrl, updatedTimestamp, totalVisits } = url ?? {};
  const [isCopied, setIsCopied] = React.useState(false);

  // const shortUrl = `${isProd ? "short.as" : "dev.short.as"}/${shortUrlId}`;
  const shortUrl = `short.as/${shortUrlId}`;

  React.useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <CardContent className="px-4 sm:px-5 py-4 sm:py-5 [&:not(:last-child)]:border-b">
      <div className="grid grid-cols-12 gap-1 sm:gap-4 items-center">
        {/* Column 1: Short + long URL */}
        <div className="flex col-span-6 sm:col-span-7 flex-col space-y-1">
          {loading ? (
            <Skeleton className="h-4 w-[140px] sm:w-[160px] my-1" />
          ) : (
            <div className="flex flex-row space-x-1 items-center">
              <div className="text-sm truncate text-ellipsis font-medium">{shortUrl}</div>
              <Button
                variant="ghost"
                size="smallIcon"
                className="text-muted-foreground"
                onClick={async () => {
                  await navigator.clipboard.writeText(shortUrl);
                  setIsCopied(true);
                  toast("Copied to clipboard!", {
                    description: shortUrl,
                    duration: 3000,
                  });
                }}
              >
                <CopyIcon className={`h-3 w-3 transition-all duration-250 ${isCopied ? "opacity-0" : "opacity-100"}`} />
                <Check
                  strokeWidth={3}
                  className={`absolute h-3 w-3 text-green-600 transition-all duration-250 ${isCopied ? "opacity-100" : "opacity-0"}`}
                />
              </Button>
            </div>
          )}
          {loading ? (
            <Skeleton className="h-3 w-[160px] sm:w-[250px]" />
          ) : (
            <div className="text-xs text-muted-foreground truncate text-ellipsis">{longUrl}</div>
          )}
        </div>

        {/* <div className="flex sm:hidden col-span-12 m-1">{}</div> */}

        {/* Column 2: Views and timestamp */}
        <div className="flex col-span-4 sm:col-span-2 col-start-7 sm:col-start-9 flex-col space-y-1 text-xs items-end">
          {loading ? (
            <Skeleton className="h-3 w-[90px] my-1" />
          ) : (
            <div className="text-muted-foreground truncate text-ellipsis font-light">
              <DateTime isoTimestamp={updatedTimestamp} />
            </div>
          )}
          {loading ? (
            <Skeleton className="h-3 w-[60px]" />
          ) : (
            <div className="flex flex-row space-x-1 font-semibold">
              <MousePointerClickIcon className="h-4 w-4" />
              <div>{totalVisits} views</div>
            </div>
          )}
        </div>

        {/* Column 3: Share button */}
        <div className="flex col-span-2 sm:col-span-2 col-start-11 justify-end gap-1">
          {loading ? <Skeleton className="h-9 w-9" /> : <QRCodeDrawerDialog shortUrl={shortUrl} />}
          {/* <ShareMenu shortUrl={shortUrl} /> */}
        </div>
      </div>
    </CardContent>
  );
};

export const YourUrls = () => {
  const { data: urls, isLoading: urlsLoading } = useSWR(USER_URLS_KEY, fetcher);

  return (
    <>
      <h3 className="text-md font-medium leading-none mb-4 mt-8">URLs</h3>
      <Card className="mb-14">
        {urlsLoading && (
          <>
            <UrlCard />
            <UrlCard />
            <UrlCard />
            <UrlCard />
          </>
        )}
        <div className="flex w-full flex-col">{urls?.map((url, i) => <UrlCard key={i} url={url} />)}</div>
      </Card>
    </>
  );
};
