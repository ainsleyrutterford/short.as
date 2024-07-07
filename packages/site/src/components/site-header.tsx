import Link from "next/link"

// import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import { MainNav } from "@/components/ui/main-nav"
import { ModeToggle } from "@/components/ui/mode-toggle";
import { MarkGithubIcon } from "@primer/octicons-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-12 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://github.com/ainsleyrutterford/short.as">
                <MarkGithubIcon className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
