"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { Avatar } from "@/components/avatar";
import { useAuth } from "@/contexts/auth";
import { useGetUrl, useUpdateUrl } from "@/queries/urls";
import { Card, CardContent } from "@/components/ui/card";
import { Input, ReadOnlyInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ArrowUpToLine, History } from "lucide-react";
import { useUrlInput } from "@/hooks/use-url-input";
import { getValidUrl } from "@/lib/url";
import { smartDateString } from "@/lib/format-date";
import { isProd } from "@/lib/utils";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UrlHistory } from "@/components/url-history";
import { Url, User } from "@short-as/types";

const EditBreadcrumbs = ({ shortUrlId }: { shortUrlId?: string }) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href="/shorten">URLs</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{shortUrlId}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);

const CreatedAndUpdatedInformation = ({ url, user }: { url: Url | undefined; user: User | undefined }) => {
  const hasBeenEdited = url?.updatedTimestamp && url?.updatedTimestamp !== url?.createdTimestamp;
  const timestamp = hasBeenEdited ? url?.updatedTimestamp : url?.createdTimestamp;
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="truncate" title={format(timestamp ?? "", "PPpp")}>
        <span className="text-muted-foreground">
          {hasBeenEdited ? "Updated" : "Created"} {smartDateString(timestamp, true)} by
        </span>{" "}
        {user?.name}
      </span>
    </span>
  );
};

const EditPage = () => {
  const searchParams = useSearchParams();
  const shortUrlId = searchParams.get("i");
  const { user } = useAuth();
  const { data: url, isLoading } = useGetUrl(shortUrlId ?? "");
  const updateUrl = useUpdateUrl();
  const { value: longUrl, setValue: setLongUrl, onChange, isValid } = useUrlInput();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  React.useEffect(() => {
    if (url?.longUrl) setLongUrl(url.longUrl);
  }, [url?.longUrl]);

  const handleUpdate = () => {
    const validatedUrl = getValidUrl(longUrl);
    if (!shortUrlId || !validatedUrl) return;
    updateUrl.mutate(
      { shortUrlId, longUrl: validatedUrl },
      {
        onSuccess: () => toast.success("URL updated"),
        onError: () => toast.error("Failed to update URL"),
      },
    );
  };

  const canUpdate = !updateUrl.isPending && isValid && longUrl.length > 0 && longUrl !== url?.longUrl;

  const shortUrl = `${isProd ? "short.as" : "dev.short.as"}/${shortUrlId}`;

  return (
    <PageContainer>
      <EditBreadcrumbs shortUrlId={shortUrlId ?? undefined} />
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="grid w-full items-center gap-y-4 sm:gap-y-6">
              <div className="grid gap-2">
                <Label>Short URL</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <ReadOnlyInput text={shortUrl} />}
              </div>
              <div>
                <Label htmlFor="long-url">Long URL</Label>
                <div className="mt-3 flex w-full items-start flex-col sm:flex-row sm:space-x-5 sm:space-y-0 space-y-4">
                  <div className="w-full">
                    {isLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : (
                      <Input
                        id="long-url"
                        type="text"
                        autoCorrect="off"
                        autoCapitalize="none"
                        autoComplete="off"
                        autoFocus
                        className="w-full"
                        value={longUrl}
                        onChange={(e) => onChange(e.target.value)}
                      />
                    )}
                    <div className={`transition-[height] duration-300 ${isValid ? "h-0" : "h-7"}`}>
                      <p
                        className={`text-sm text-destructive pt-2 transition-all duration-200 ${isValid ? "opacity-0" : "opacity-100"}`}
                      >
                        Please enter a valid URL
                      </p>
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={!canUpdate}>
                    <ArrowUpToLine className="mr-2 h-4 w-4" />
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
      <div className="flex items-center gap-2 mt-6 text-xs">
        <Avatar size="20px" imageUrl={user?.profilePictureUrl} />
        {isLoading ? (
          <Skeleton className="inline-block h-4 w-48" />
        ) : (
          <CreatedAndUpdatedInformation url={url} user={user} />
        )}
        {url && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="smallIcon"
                  className="ml-auto text-muted-foreground shrink-0"
                  onClick={() => setHistoryOpen(true)}
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>URL history</TooltipContent>
            </Tooltip>
            <UrlHistory open={historyOpen} onOpenChange={setHistoryOpen} url={url} />
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default function Edit() {
  return (
    <Suspense>
      <EditPage />
    </Suspense>
  );
}
