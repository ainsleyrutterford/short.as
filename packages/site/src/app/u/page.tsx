"use client";

import { Button } from "@/components/ui/button";
import { ReadOnlyInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeDrawerDialog } from "@/components/qr-code";
import { ArrowUpRight, ClipboardCopy, Repeat } from "lucide-react";
import { ShareMenu } from "@/components/share-menu";
import { useIds } from "@/contexts/ids";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const TextGradient = ({ text }: { text: string }) => {
  const { resolvedTheme } = useTheme();
  const bgGradient =
    resolvedTheme === "light"
      ? "bg-[linear-gradient(to_right,theme(colors.violet.600),theme(colors.fuchsia.500),theme(colors.purple.500),theme(colors.violet.600))]"
      : "bg-[linear-gradient(to_right,theme(colors.violet.300),theme(colors.fuchsia.300),theme(colors.purple.100),theme(colors.violet.300))]";
  return (
    <span className={`font-black bg-clip-text text-transparent ${bgGradient} bg-[length:200%_auto] animate-gradient`}>
      {text}
    </span>
  );
};

const ShortUrlDetailsContents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamShortUrlId = searchParams.get("i");

  const { longUrl, setLongUrl } = useIds();
  const [fadeIn, setFadeIn] = useState(true);

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

      if (longUrl) {
        // We only fade in the longUrl if it is loaded from an API, if we have it straight away
        // then we can just show it straight away
        setFadeIn(false);
      } else {
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
            <CardTitle>
              Wow, that really is <TextGradient text="short.as!" />
            </CardTitle>
            {/* <CardDescription>Card Description. Stage: {process.env.NEXT_PUBLIC_STAGE}</CardDescription> */}
          </CardHeader>
          <CardContent>
            <div className="grid gap-y-6">
              <div className="grid gap-2">
                <Label>Long URL</Label>
                <ReadOnlyInput text={longUrl} fadeIn={fadeIn} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="short-as-url">Short.as URL</Label>
                <ReadOnlyInput text={shortUrl} />
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
                    toast("Copied to clipboard!", {
                      description: shortUrl,
                      duration: 3000,
                    });
                  }}
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy short URL
                </Button>
                <Link href="/" prefetch={false}>
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
