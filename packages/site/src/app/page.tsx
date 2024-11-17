"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { getValidUrl } from "@/lib/url";
import { useRouter } from "next/navigation";
import { useIds } from "@/contexts/ids";
import { toast } from "sonner";
import { GradientCard } from "@/components/gradient-card";

// Data fetching from the client in Next.js:
// https://nextjs.org/docs/app/building-your-application/deploying/static-exports#client-components

const ToShortenCard = () => {
  const router = useRouter();

  const { setShortUrlId, setLongUrl } = useIds();

  const [urlToShorten, setUrlToShorten] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <GradientCard>
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

            const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-short-url`, {
              method: "POST",
              body: JSON.stringify({ longUrl: validatedUrl }),
            });
            if (data.status !== 200) throw new Error(`Received status code: ${data.status}`);

            const json = await data.json();
            setShortUrlId(json.shortUrlId);
            setLoading(false);

            router.push(`/u?i=${json.shortUrlId}`);
          } catch (error) {
            toast.error("Server Error", {
              description: "Please try again later",
              duration: 5000,
            });
            console.error(error);
          }
        }}
      >
        <CardHeader>
          <CardTitle>Let's shorten a URL</CardTitle>
          {/* <CardDescription>Card Description. Stage: {process.env.NEXT_PUBLIC_STAGE}</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center">
            <Label htmlFor="long-url">Long URL</Label>
            <Input
              id="long-url"
              type="text"
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="Enter the URL to shorten"
              className="mt-2"
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
                className={`text-sm text-destructive mt-2 transition-[height] transition-all duration-200 ${isValidUrl ? "opacity-0" : "opacity-100"}`}
              >
                Please enter a valid URL
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full z-10" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Minimize2 className="mr-2 h-4 w-4" />}
            Make it short as
          </Button>
        </CardFooter>
      </form>
    </GradientCard>
  );
};

export default ToShortenCard;
