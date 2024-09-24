"use client";

import Link from "next/link"

import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const NavItem = ({ href, text, prefetch }: { href: string; text: string; prefetch?: boolean }) => {
  const location = usePathname();
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${location !== href ? "text-muted-foreground" : ""} text-sm font-medium transition-colors hover:text-primary`}
    >
      {text}
    </Link>
  );
};

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {/* We had to disable prefetching because the file created by NextJS would be reachable under
      `./${basePath}/index.txt` but the prefetching was trying to fetch `./create.txt` instead */}
      <NavItem href="/" text="Create" prefetch={false} />
      <NavItem href="/about" text="About" />
    </nav>
  )
}
