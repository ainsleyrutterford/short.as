"use client"

/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { Separator } from "@/components/ui/separator";
import { QRCodeDrawerDialog } from "@/components/qr-code";
import { ArrowUpRight, ClipboardCopy, Minimize2, Repeat } from "lucide-react";
import { SetStateAction, useState } from "react";
import Link from "next/link";
import { ShareMenu } from "@/components/share-menu";


// Data fetching from the client in Next.js:
// https://nextjs.org/docs/app/building-your-application/deploying/static-exports#client-components

type CardProps = {
  longUrl: string;
  setLongUrl: React.Dispatch<SetStateAction<string>>;
  shortUrlId: string;
  setShortUrlId: React.Dispatch<SetStateAction<string>>;
  setIsOnShortenCard: React.Dispatch<SetStateAction<boolean>>;
};

const ToShortenCard = ({ longUrl, setLongUrl, shortUrlId, setShortUrlId, setIsOnShortenCard }: CardProps) => (
  <Card className="mt-10 sm:mt-16">
    <CardHeader>
      <CardTitle>Let's shorten a URL</CardTitle>
      {/* <CardDescription>Card Description. Stage: {process.env.NEXT_PUBLIC_STAGE}</CardDescription> */}
    </CardHeader>
    <CardContent>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="long-url">Long URL</Label>
        <Input id="long-url" type="text" autoCorrect="off" autoCapitalize="none" placeholder="Enter the URL to shorten" value={longUrl} onChange={(event) => setLongUrl(event.target.value)} />
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full" onClick={async () => {
        const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-short-url`, {
          method: 'POST',
          body: JSON.stringify({ longUrl }),
        });
        const json = await data.json();
        setShortUrlId(json.shortUrlId);
        setIsOnShortenCard(false);
      }}>
        {/* <EnvelopeOpenIcon className="mr-2 h-4 w-4" />  */}
        <Minimize2 className="mr-2 h-4 w-4" />
        Make it short as
      </Button>

      {/* <Button onClick={async () => {
        // Had to add http://localhost:3000 to allowed origins in API Gateway
        // const data = await window.fetch('https://ogizw1xrqk.execute-api.eu-west-2.amazonaws.com/get-long-url/QjJlMJf');
        // window.location.href = 'https://ogizw1xrqk.execute-api.eu-west-2.amazonaws.com/get-long-url/QjJlMJf';
        // const json = await data.json();
        // console.log(json);
      }}>Go to long URL</Button> */}
    </CardFooter>
  </Card>
);

const HasShortenedCard = ({ longUrl, setLongUrl, shortUrlId, setShortUrlId, setIsOnShortenCard }: CardProps) => {
  const shortUrl = process.env.NEXT_PUBLIC_STAGE === 'prod' ? `https://short.as/${shortUrlId}` : `https://dev.short.as/${shortUrlId}`;
  return (
    <Card className="mt-10 sm:mt-16">
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
            <Button className="w-full" onClick={async () => {
              navigator.clipboard.writeText(shortUrl);
            }}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy short URL
            </Button>
            <Button className="w-full" variant="secondary" onClick={async () => {
              setLongUrl('');
              setShortUrlId('');
              setIsOnShortenCard(true);
            }}>
              <Repeat className="mr-2 h-4 w-4" />
              Shorten another
            </Button>
          </div>
          <Separator />
          <div className="flex justify-end gap-x-6">
            <ShareMenu shortUrl={shortUrl} />
            <QRCodeDrawerDialog shortUrl={shortUrl} />
            <Tooltip delayDuration={250}>
              <TooltipTrigger>
                <Button variant="outline" size="icon" asChild >
                  <Link href={shortUrl}><ArrowUpRight className="h-4 w-4" /></Link>
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
  )
};

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrlId, setShortUrlId] = useState('');
  const [isOnShortenCard, setIsOnShortenCard] = useState(true);

  return (
    <>
      <SiteHeader />
      <div className="max-w-screen-md mx-auto px-4">
        {isOnShortenCard ?
          <ToShortenCard longUrl={longUrl} setLongUrl={setLongUrl} shortUrlId={shortUrlId} setShortUrlId={setShortUrlId} setIsOnShortenCard={setIsOnShortenCard} />
          :
          <HasShortenedCard longUrl={longUrl} setLongUrl={setLongUrl} shortUrlId={shortUrlId} setShortUrlId={setShortUrlId} setIsOnShortenCard={setIsOnShortenCard} />
        }
      </div>
    </>
  );
}
