"use client";

import { LoadingSpinner } from "@/components/ui/loading";
import { useAuth } from "@/contexts/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

const RedirectContents = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoggedIn } = useAuth();

  React.useEffect(() => {
    // Set loggedIn state in localStorage and React context
    if (searchParams.get("loggedIn") === "true") {
      window.localStorage.setItem("loggedIn", "true");
      setLoggedIn(true);
    }

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
      window.location.href = `${window.location.origin}/create`;
    } else {
      // Otherwise we can just redirect with NextJS JavaScript
      router.push("/");
    }
  }, []);

  return (
    <div className="flex h-10 items-center justify-center space-x-4 mt-20">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default function Redirect() {
  return (
    <Suspense>
      <RedirectContents />
    </Suspense>
  );
}
