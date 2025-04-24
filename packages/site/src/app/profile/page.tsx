"use client";

import { FacebookLogo } from "@/assets/facebook";
import { GoogleLogo } from "@/assets/google";
import { Avatar } from "@/components/avatar";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth";
import { MarkGithubIcon } from "@primer/octicons-react";
import { OAuthProvider } from "@short-as/types";
import { useRouter } from "next/navigation";
import React from "react";

const ProviderIcon = ({ provider }: { provider?: OAuthProvider }) => {
  const className = "h-5 w-5";
  if (provider === OAuthProvider.Google) {
    return <GoogleLogo className={className} />;
  }
  if (provider === OAuthProvider.GitHub) {
    return <MarkGithubIcon className={className} />;
  }
  if (provider === OAuthProvider.Facebook) {
    return <FacebookLogo className={className} />;
  }
  return <></>;
};

export default function Profile() {
  const router = useRouter();
  const { setLoggedIn, user } = useAuth();

  React.useEffect(() => {
    if (window.localStorage.getItem("loggedIn") !== "true") {
      router.push("/login");
    }
  }, []);

  return (
    <PageContainer>
      <div className="flex flex-col">
        <Card>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <div className="relative">
                <div className="flex justify-center items-center h-8 w-8 absolute -top-1 -right-1 border bg-card shadow rounded-full">
                  <ProviderIcon provider={user?.oAuthProvider} />
                </div>
                <Avatar size="80px" imageUrl={user?.profilePictureUrl} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-5 pt-0">
            <div className="grid w-full items-center gap-y-6">
              <Separator />
              <Button
                onClick={async () => {
                  const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth/logout`, {
                    method: "POST",
                    // Necessary to send cookies
                    credentials: "include",
                  });
                  if (data.status !== 200) throw new Error(`Received status code: ${data.status}`);

                  window.localStorage.setItem("loggedIn", "false");
                  setLoggedIn(false);
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
