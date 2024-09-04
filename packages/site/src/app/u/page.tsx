"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeDrawerDialog } from "@/components/qr-code";
import { ArrowUpRight, ClipboardCopy, Repeat } from "lucide-react";
import { ShareMenu } from "@/components/share-menu";
import { useIds } from "@/contexts/ids";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Link from "next/link";

const ShortUrlDetailsContents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamShortUrlId = searchParams.get("i");

  const { longUrl, setLongUrl } = useIds();

  const shortUrl =
    process.env.NEXT_PUBLIC_STAGE === "prod"
      ? `https://short.as/${searchParamShortUrlId}`
      : `https://dev.short.as/${searchParamShortUrlId}`;

  useEffect(() => {
    (async () => {
      // If no shortUrlId is provided then redirect to the index as this page relies on one
      if (!searchParamShortUrlId) {
        router.push("/");
        return;
      }

      if (!longUrl) {
        const data = await window.fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/get-long-url-details/${searchParamShortUrlId}`,
        );
        const json = await data.json();
        setLongUrl(json.longUrl);
      }
    })();
  }, []);

  return (
    <>
      {!!searchParamShortUrlId && (
        <Card>
          <CardHeader>
            <CardTitle>Wow, that really is short.as!</CardTitle>
            {/* <CardDescription>Card Description. Stage: {process.env.NEXT_PUBLIC_STAGE}</CardDescription> */}
          </CardHeader>
          <CardContent>
            <div className="grid gap-y-6">
              <div className="grid gap-2">
                {/* TODO: for some reason, when tapping on this in iOS, the autofill menu shows up at the top of the screen */}
                <Label htmlFor="entered-long-url">Long URL</Label>
                <Input type="text" id="entered-long-url" defaultValue={longUrl} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="short-as-url">Short.as URL</Label>
                <Input type="text" id="short-as-url" defaultValue={shortUrl} readOnly />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="grid w-full items-center gap-y-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 grid-cols-1">
                <Button
                  className="w-full"
                  onClick={async () => {
                    navigator.clipboard.writeText(shortUrl);
                  }}
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy short URL
                </Button>
                <Link href="/">
                  <Button className="w-full" variant="secondary">
                    <Repeat className="mr-2 h-4 w-4" />
                    Shorten another
                  </Button>
                </Link>
              </div>
              <Separator />
              <div className="flex justify-end gap-x-6">
                <ShareMenu shortUrl={shortUrl} />
                <QRCodeDrawerDialog shortUrl={shortUrl} />
                <Tooltip delayDuration={250}>
                  <TooltipTrigger>
                    <Button variant="outline" size="icon" asChild>
                      <a href={shortUrl}>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Visit short.as link</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default function ShortUrlDetails() {
  return (
    <Suspense>
      <ShortUrlDetailsContents />
    </Suspense>
  );
}
