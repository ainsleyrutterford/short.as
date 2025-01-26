"use client";

import { LoadingSpinner } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";

/**
 * We are no longer using this page as navigating to it cannot be done on client side,
 * it causes a full page load which causes React context useEffects to re-run, etc.
 *
 * Instead we are redirecting to the "/shorten" route which will be the home page now,
 * and client side navigation and prefetching works properly.
 */
const RedirectContents = () => {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/shorten");
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
