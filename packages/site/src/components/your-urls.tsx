import React from "react";
import { Check, CopyIcon, MousePointerClickIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { Url } from "@short-as/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUrls } from "@/queries/urls";
import { UrlOptions } from "./url-options";
import { UrlPagination } from "./url-pagination";
import { isProd } from "@/lib/utils";
import { smartDateString } from "@/lib/format-date";

const DateTime = ({ isoTimestamp }: { isoTimestamp?: string }) => (
  <span title={format(isoTimestamp ?? "", "PPpp")}>{smartDateString(isoTimestamp)}</span>
);

interface UrlCardProps {
  url?: Url;
}

const UrlCard = ({ url }: UrlCardProps) => {
  const loading = url === undefined;
  const { shortUrlId, longUrl, updatedTimestamp, totalVisits } = url ?? {};
  const [isCopied, setIsCopied] = React.useState(false);

  const shortUrl = `${isProd ? "short.as" : "dev.short.as"}/${shortUrlId}`;

  React.useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <Card>
      <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
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
                    await copyToClipboard(shortUrl);
                    setIsCopied(true);
                  }}
                >
                  <CopyIcon
                    className={`h-3 w-3 transition-all duration-250 ${isCopied ? "opacity-0" : "opacity-100"}`}
                  />
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
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {loading ? <Skeleton className="h-9 w-9" /> : <UrlOptions shortUrlId={shortUrlId!} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NoUrls = () => (
  <Card>
    <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
      <p className="text-xs text-muted-foreground text-center">
        You don't have any URLs yet, shorten one and you'll see it here!
      </p>
    </CardContent>
  </Card>
);

const ITEMS_PER_PAGE = 8;

export const YourUrls = () => {
  const { data: urls, isLoading: urlsLoading } = useGetUrls();
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil((urls?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUrls = urls?.slice(startIndex, endIndex);

  React.useEffect(() => {
    if (currentPage < 1 || (currentPage > totalPages && totalPages > 0)) setCurrentPage(1);
  }, [currentPage, totalPages]);

  return (
    <>
      <h3 className="text-md font-medium leading-none mb-4 mt-8">URLs</h3>
      <div className="mb-6 flex flex-col gap-3">
        {currentUrls?.map((url, i) => <UrlCard key={i} url={url} />)}
        {urlsLoading && (
          <>
            <UrlCard />
            <UrlCard />
            <UrlCard />
            <UrlCard />
          </>
        )}
        {!urlsLoading && urls?.length === 0 && <NoUrls />}
      </div>
      {!urlsLoading && totalPages > 1 && (
        <UrlPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </>
  );
};
