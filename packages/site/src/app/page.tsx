"use client"

/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header";


// Data fetching from the client in Next.js:
// https://nextjs.org/docs/app/building-your-application/deploying/static-exports#client-components

const TypographyDemo = () => (
  <div>
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      This is a test header
    </h1>
    <p className="leading-7 [&:not(:first-child)]:mt-6">
      This is a test paragraph!
    </p>
  </div>
);

export default function Home() {
  const [longUrl, setLongUrl] = useState('');

  return (
    <>
      <SiteHeader />
      <div className="sm:container sm:mx-auto">
        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="long url" placeholder="Long URL" value={longUrl} onChange={(event) => setLongUrl(event.target.value)} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={async () => {
              // Had to add http://localhost:3000 to allowed origins in API Gateway
              const data = await window.fetch('https://ogizw1xrqk.execute-api.eu-west-2.amazonaws.com/create-short-url', {
                method: 'POST',
                body: JSON.stringify({ longUrl }),
              });
              const json = await data.json();
              console.log(json);
            }}>Make it short as</Button>

            <Button onClick={async () => {
              // Had to add http://localhost:3000 to allowed origins in API Gateway
              // const data = await window.fetch('https://ogizw1xrqk.execute-api.eu-west-2.amazonaws.com/get-long-url/QjJlMJf');
              // window.location.href = 'https://ogizw1xrqk.execute-api.eu-west-2.amazonaws.com/get-long-url/QjJlMJf';
              // const json = await data.json();
              // console.log(json);
            }}>Go to long URL</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
