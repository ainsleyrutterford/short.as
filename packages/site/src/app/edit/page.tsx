"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { Avatar } from "@/components/avatar";
import { useAuth } from "@/contexts/auth";
import { useGetUrl, useUpdateUrl } from "@/queries/urls";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowUpToLine } from "lucide-react";
import { useUrlInput } from "@/hooks/use-url-input";
import { getValidUrl } from "@/lib/url";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const EditBreadcrumbs = ({ shortUrlId }: { shortUrlId?: string }) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/create/shorten">URLs</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{shortUrlId}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);

const EditPage = () => {
  const searchParams = useSearchParams();
  const shortUrlId = searchParams.get("i");
  const { user } = useAuth();
  const { data: url, isLoading } = useGetUrl(shortUrlId ?? "");
  const updateUrl = useUpdateUrl();
  const { value: longUrl, setValue: setLongUrl, onChange, isValid } = useUrlInput();

  React.useEffect(() => {
    if (url?.longUrl) setLongUrl(url.longUrl);
  }, [url?.longUrl]);

  return (
    <PageContainer>
      <EditBreadcrumbs shortUrlId={shortUrlId ?? undefined} />
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid w-full items-center">
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
              {/* TODO: add submission on pressing Enter key */}
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={updateUrl.isPending || !isValid || longUrl.length === 0 || longUrl === url?.longUrl}
                onClick={() => {
                  const validatedUrl = getValidUrl(longUrl);
                  if (!shortUrlId || !validatedUrl) return;
                  updateUrl.mutate(
                    { shortUrlId, longUrl: validatedUrl },
                    {
                      onSuccess: () => toast.success("URL updated"),
                      onError: () => toast.error("Failed to update URL"),
                    },
                  );
                }}
              >
                <ArrowUpToLine className="mr-2 h-4 w-4" />
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 mt-6 text-xs">
        <Avatar size="20px" imageUrl={user?.profilePictureUrl} />
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Created by </span>
          {isLoading ? <Skeleton className="inline-block h-4 w-32" /> : user?.name}
        </span>
      </div>
      {/* TODO: add date */}
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
