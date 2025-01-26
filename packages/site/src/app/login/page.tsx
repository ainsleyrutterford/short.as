"use client";

import { Button } from "@/components/ui/button";
import { MarkGithubIcon } from "@primer/octicons-react";
import Link from "next/link";
import { FacebookLogo } from "@/assets/facebook";
import { GoogleLogo } from "@/assets/google";
import { PageContainer } from "@/components/page-container";

const createGoogleOAuthUrl = () => {
  const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  // https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient
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

const createGitHubOAuthUrl = () => {
  const baseUrl = "https://github.com/login/oauth/authorize";

  const queryStrings = new URLSearchParams({ client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "" });

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

const Login = () => {
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
          <Link className="z-10" href={createGoogleOAuthUrl()} prefetch={false}>
            <Button className="w-full" variant="secondary">
              <GoogleLogo className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </Link>
          <Link className="z-10" href={createFacebookOAuthUrl()} prefetch={false}>
            <Button className="w-full z-10" variant="secondary">
              <FacebookLogo className="mr-2 h-4 w-4" />
              Continue with Facebook
            </Button>
          </Link>
          <Link className="z-10" href={createGitHubOAuthUrl()} prefetch={false}>
            <Button className="w-full z-10" variant="secondary">
              <MarkGithubIcon className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </Link>
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
