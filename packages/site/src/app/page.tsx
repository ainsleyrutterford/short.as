"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Minimize2 } from "lucide-react";
import { useState } from "react";
import { getValidUrl } from "@/lib/url";
import { useRouter } from "next/navigation";
import { useIds } from "@/contexts/ids";

// Data fetching from the client in Next.js:
// https://nextjs.org/docs/app/building-your-application/deploying/static-exports#client-components

const ToShortenCard = () => {
  const router = useRouter();

  const { setShortUrlId, setLongUrl } = useIds();

  const [urlToShorten, setUrlToShorten] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Let's shorten a URL</CardTitle>
        {/* <CardDescription>Card Description. Stage: {process.env.NEXT_PUBLIC_STAGE}</CardDescription> */}
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="long-url">Long URL</Label>
          <Input
            id="long-url"
            type="text"
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="Enter the URL to shorten"
            value={urlToShorten}
            onChange={(event) => setUrlToShorten(event.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={async () => {
            const validatedUrl = getValidUrl(urlToShorten);
            if (validatedUrl) {
              setLongUrl(validatedUrl);
              const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-short-url`, {
                method: "POST",
                body: JSON.stringify({ longUrl: validatedUrl }),
              });
              const json = await data.json();
              setShortUrlId(json.shortUrlId);

              router.push(`/u?i=${json.shortUrlId}`);
            } else {
              // TODO: error state!
              console.log("Error! Not a valid URL!");
            }
          }}
        >
          {/* <EnvelopeOpenIcon className="mr-2 h-4 w-4" />  */}
          <Minimize2 className="mr-2 h-4 w-4" />
          Make it short as
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ToShortenCard;
