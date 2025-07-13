"use client";

import { Button } from "@/components/ui/button";
import { MarkGithubIcon } from "@primer/octicons-react";
import Link from "next/link";
import { FacebookLogo } from "@/assets/facebook";
import { GoogleLogo } from "@/assets/google";
import { PageContainer } from "@/components/page-container";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OAuthProvider } from "@short-as/types";

/** https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient */
const createGoogleOAuthUrl = () => {
  const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const queryStrings = new URLSearchParams({
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URL ?? "",
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    // offline means that a refresh token should also be returned
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
  });

  return `${baseUrl}?${queryStrings.toString()}`;
};

/** https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity */
const createGitHubOAuthUrl = () => {
  const baseUrl = "https://github.com/login/oauth/authorize";

  const queryStrings = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "",
    redirect_uri: process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT_URL ?? "",
  });

  return `${baseUrl}?${queryStrings.toString()}`;
};

const createFacebookOAuthUrl = () => {
  const baseUrl = "https://www.facebook.com/v21.0/dialog/oauth";

  const queryStrings = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ?? "",
    redirect_uri: process.env.NEXT_PUBLIC_FACEBOOK_OAUTH_REDIRECT_URL ?? "",
    scope: "email,public_profile",
    state: "temp",
  });

  return `${baseUrl}?${queryStrings.toString()}`;
};

const LastUsed = () => (
  <div className="absolute -top-4 -right-20 text-[0.7rem]/3 bg-primary text-primary-foreground rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-[2px] px-1.5 py-[3px]">
    Last used
  </div>
);

const Login = () => {
  const router = useRouter();
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
          <Button className="w-full relative" variant="secondary" onClick={() => router.push(createGoogleOAuthUrl())}>
            <div className="relative flex items-center">
              <GoogleLogo className="mr-2 h-4 w-4" />
              <span>Continue with Google</span>

              {lastUsedOAuthProvider === OAuthProvider.Google && <LastUsed />}
            </div>
          </Button>
          <Button className="w-full relative" variant="secondary" onClick={() => router.push(createFacebookOAuthUrl())}>
            <div className="relative flex items-center">
              <FacebookLogo className="mr-2 h-4 w-4" />
              <span>Continue with Facebook</span>

              {lastUsedOAuthProvider === OAuthProvider.Facebook && <LastUsed />}
            </div>
          </Button>
          <Button className="w-full relative" variant="secondary" onClick={() => router.push(createGitHubOAuthUrl())}>
            <div className="relative flex items-center">
              <MarkGithubIcon className="mr-2 h-4 w-4" />
              <span>Continue with GitHub</span>

              {lastUsedOAuthProvider === OAuthProvider.GitHub && <LastUsed />}
            </div>
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
