"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/ui/main-nav";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { MarkGithubIcon } from "@primer/octicons-react";
import { useAuth } from "@/contexts/auth";
import { Avatar } from "./avatar";
import React from "react";
import { useTheme } from "next-themes";

const SiteHeader = () => {
  const { resolvedTheme } = useTheme();

  const { loggedIn, user } = useAuth();

  const dropShadow =
    resolvedTheme === "light"
      ? "hover:drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]"
      : "hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]";

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md bg-background/65">
      <div className="container flex h-12 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/ainsleyrutterford/short.as">
                <MarkGithubIcon className="h-[1.2rem] w-[1.2rem]" />
              </a>
            </Button>
            <ModeToggle />
            {loggedIn && (
              <Link href="/profile" className={`transition-drop-shadow duration-200 ease-in-out ${dropShadow}`}>
                <Avatar imageUrl={user?.profilePictureUrl} />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
