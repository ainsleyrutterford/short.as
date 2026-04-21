"use client";

import { Button } from "@/components/ui/button";
import { MarkGithubIcon } from "@primer/octicons-react";
import Link from "next/link";
import { GoogleLogo } from "@/assets/google";
import { MicrosoftLogo } from "@/assets/microsoft";
import { PageContainer } from "@/components/page-container";
import { useEffect, useState } from "react";
import { OAuthProvider } from "@short-as/types";

const LastUsed = () => (
  <div className="absolute -top-4 -right-20 text-[0.7rem]/3 bg-primary text-primary-foreground rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-[2px] px-1.5 py-[3px]">
    Last used
  </div>
);

const oAuthStartUrl = (provider: OAuthProvider) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth/start?provider=${provider}`;

const Login = () => {
  const [lastUsedOAuthProvider, setLastUsedOAuthProvider] = useState("");

  useEffect(() => {
    setLastUsedOAuthProvider(window.localStorage.getItem("lastUsedOAuthProvider") ?? "");
  }, []);

  return (
    <PageContainer>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          console.log(e);
        }}
      >
        <div className="mb-8 flex flex-col w-full">
          <p className="mb-4 text-xl font-semibold text-foreground text-center">Welcome to short.as</p>
          <p className="text-sm text-muted-foreground text-center">
            Login to manage, update, or track analytics for your URLs with ease.
          </p>
        </div>
        <div className="grid w-full items-center gap-y-2">
          <Button className="w-full relative" variant="secondary" asChild>
            <a href={oAuthStartUrl(OAuthProvider.Google)}>
              <div className="relative flex items-center">
                <GoogleLogo className="mr-2 h-4 w-4" />
                <span>Continue with Google</span>

                {lastUsedOAuthProvider === OAuthProvider.Google && <LastUsed />}
              </div>
            </a>
          </Button>
          <Button className="w-full relative" variant="secondary" asChild>
            <a href={oAuthStartUrl(OAuthProvider.Microsoft)}>
              <div className="relative flex items-center">
                <MicrosoftLogo className="mr-2 h-4 w-4" />
                <span>Continue with Microsoft</span>

                {lastUsedOAuthProvider === OAuthProvider.Microsoft && <LastUsed />}
              </div>
            </a>
          </Button>
          <Button className="w-full relative" variant="secondary" asChild>
            <a href={oAuthStartUrl(OAuthProvider.GitHub)}>
              <div className="relative flex items-center">
                <MarkGithubIcon className="mr-2 h-4 w-4" />
                <span>Continue with GitHub</span>

                {lastUsedOAuthProvider === OAuthProvider.GitHub && <LastUsed />}
              </div>
            </a>
          </Button>
        </div>
        <div className="mt-8 flex w-full items-center justify-center flex-row">
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to the{" "}
            <Link className="underline" href="/tos">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </form>
    </PageContainer>
  );
};

export default Login;
