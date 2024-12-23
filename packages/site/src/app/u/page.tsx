"use client";

import { Button } from "@/components/ui/button";
import { ReadOnlyInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QRCodeDrawerDialog } from "@/components/qr-code";
import { ArrowUpRight, Check, ClipboardCopy, Repeat } from "lucide-react";
import { ShareMenu } from "@/components/share-menu";
import { useIds } from "@/contexts/ids";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GradientCard } from "@/components/gradient-card";
import { TextGradient } from "@/components/text-gradient";
import { BlurCard } from "@/components/blur-card";

const ShortUrlDetailsContents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamShortUrlId = searchParams.get("i");

  const { longUrl, setLongUrl } = useIds();
  const [fadeIn, setFadeIn] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

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
        if (data.status / 100 === 5) {
          toast.error("Server Error", {
            description: "Please try again later",
            duration: 5000,
          });
          return;
        } else if (data.status === 404) {
          toast.error("URL not found", {
            description: "We could not find a short URL with this ID",
            duration: 5000,
          });
          return;
        }
        const json = await data.json();

        setLongUrl(json?.longUrl ?? "");
      }
    })();
  }, []);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold leading-none mb-4">
        Wow, that really is <TextGradient text="short.as!" />
      </h3>
      {!!searchParamShortUrlId && (
        <BlurCard>
          <CardContent className="p-5">
            <div className="grid gap-y-6">
              <div className="grid gap-2">
                <Label>Long URL</Label>
                <ReadOnlyInput text={longUrl} fadeIn={fadeIn} className="bg-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="short-as-url">Short.as URL</Label>
                <ReadOnlyInput text={shortUrl} className="bg-white" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-5 pt-0">
            <div className="grid w-full items-center gap-y-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 grid-cols-1">
                <Button
                  className="w-full z-10"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shortUrl);
                    setIsCopied(true);
                    toast("Copied to clipboard!", {
                      description: shortUrl,
                      duration: 3000,
                    });
                  }}
                >
                  <span className="flex items-center">
                    <ClipboardCopy
                      className={`mr-2 h-4 w-4 transition-all duration-250 ${isCopied ? "opacity-0" : "opacity-100"}`}
                    />
                    <Check
                      strokeWidth={3}
                      className={`absolute mr-2 h-4 w-4 text-green-600 transition-all duration-250 ${isCopied ? "opacity-100" : "opacity-0"}`}
                    />
                    Copy short URL
                  </span>
                </Button>
                <Link className="z-10" href="/" prefetch={false}>
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
                  <TooltipTrigger className="z-10">
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
        </BlurCard>
      )}
      <div className="mt-8 flex w-full items-center justify-center flex-row">
        <p className="text-sm text-muted-foreground text-center">
          Want to manage, update, or track analytics for your URLs?{"  "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/login" prefetch={false}>
            Create a free account!
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function ShortUrlDetails() {
  return (
    <Suspense>
      <ShortUrlDetailsContents />
    </Suspense>
  );
}
