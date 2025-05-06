"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Minimize2 } from "lucide-react";
import React, { Suspense, useState } from "react";
import { getValidUrl } from "@/lib/url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useIds } from "@/contexts/ids";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingSpinner } from "@/components/ui/loading";
import { CreateAccountSuggestion } from "@/components/create-account-suggestion";
import { PageContainer } from "@/components/page-container";
import { isProd } from "@/lib/utils";

// Data fetching from the client in Next.js:
// https://nextjs.org/docs/app/building-your-application/deploying/static-exports#client-components

const LoginState = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { setLoggedIn } = useAuth();

  React.useEffect(() => {
    // Set loggedIn state in localStorage and React context
    if (searchParams.get("loggedIn") === "true") {
      window.localStorage.setItem("loggedIn", "true");
      setLoggedIn(true);

      /**
       * For some reason, localhost cookies are only sent on Firefox after a page reload (even when using
       * `credentials: 'include` in the `fetch` call). Various sources online seem to suggest that
       * this is expected behaviour. But on Chrome they are sent without a page reload.
       *
       * - https://github.com/vercel/next.js/discussions/38676
       * - https://stackoverflow.com/q/13707721
       *
       * We remove the search params and reload the page completely.
       */
      if (window.location.origin.includes("localhost")) {
        // For localhost we remove the search params and load the new page
        window.location.href = `${window.location.origin}/create/shorten`;
      } else {
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.delete("loggedIn");
        router.replace(`${pathname}?${nextSearchParams}`);
      }
    }
  }, []);

  return <></>;
};

const ShortenPage = () => {
  const router = useRouter();

  const { loggedIn } = useAuth();
  const { setShortUrlId, setLongUrl } = useIds();

  const [urlToShorten, setUrlToShorten] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <PageContainer>
      <div className="flex flex-col">
        <Suspense>
          <LoginState />
        </Suspense>
        <h3 className="text-xl font-semibold leading-none mb-4">Shorten a URL</h3>
        <Card>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const validatedUrl = getValidUrl(urlToShorten);

              if (!validatedUrl) {
                console.log("Error! Not a valid URL!");
                return;
              }

              try {
                setLongUrl(validatedUrl);
                setLoading(true);

                const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/urls`, {
                  method: "POST",
                  // Necessary to send cookies
                  credentials: "include",
                  body: JSON.stringify({ longUrl: validatedUrl }),
                });
                if (data.status !== 200) throw new Error(`Received status code: ${data.status}`);

                const json = await data.json();
                setShortUrlId(json.shortUrlId);

                router.push(`/u?i=${json.shortUrlId}`);
              } catch (error) {
                toast.error("Server Error", {
                  description: "Please try again later",
                  duration: 5000,
                });
                console.error(error);
                setLoading(false);
              }
            }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="grid w-full items-center">
                <Label htmlFor="long-url">Long URL</Label>
                <div className="mt-3 flex w-full items-start flex-col sm:flex-row sm:space-x-5 sm:space-y-0 space-y-4">
                  <div className="w-full">
                    <Input
                      id="long-url"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="none"
                      autoComplete="off"
                      placeholder="Enter the URL to shorten"
                      className="w-full"
                      value={urlToShorten}
                      onChange={(event) => {
                        const validatedUrl = getValidUrl(event.target.value);

                        if (validatedUrl || event.target.value === "") {
                          setIsValidUrl(true);
                        } else {
                          setIsValidUrl(false);
                        }

                        setUrlToShorten(event.target.value);
                      }}
                    />
                    <div className={`transition-[height] duration-300 ${isValidUrl ? "h-0" : "h-7"}`}>
                      <p
                        className={`text-sm text-destructive pt-2 transition-[height] transition-all duration-200 ${isValidUrl ? "opacity-0" : "opacity-100"}`}
                      >
                        Please enter a valid URL
                      </p>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="z-10 w-full sm:w-auto"
                    disabled={loading || !isValidUrl || urlToShorten.length === 0}
                  >
                    {loading ? (
                      <LoadingSpinner className="mr-2" size="xs" color="inverse" />
                    ) : (
                      <Minimize2 className="mr-2 h-4 w-4" />
                    )}
                    Make it short as
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
        {/* For now, only show login for dev */}
        {!isProd && !loggedIn && <CreateAccountSuggestion />}
      </div>
    </PageContainer>
  );
};

export default ShortenPage;
