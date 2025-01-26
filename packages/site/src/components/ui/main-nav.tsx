"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const NavItem = ({ href, text }: { href: string; text: string; }) => {
  const location = usePathname();
  return (
    <Link
      href={href}
      className={`${location !== href ? "text-muted-foreground" : ""} text-sm font-medium transition-colors hover:text-primary`}
    >
      {text}
    </Link>
  );
};

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {/* TODO: ended up making the home page not just / since I couldn't get it to stop doing a full native browser
      navigation. Maybe we should update the CloudFront distribution so that the default behaviour is
      S3 (remove the basePath of create from NextJS too) and add a special CloudFront function to ensure
      that any requests to only letters with length of 7 (no numbers or special symbols or periods) are
      redirected to the get longUrl API endpoint? Then we can have `https://short.as/about without the
      create prefix. Be careful to still ensure only client side navigation, maybe we don't have anything
      at the route of short.as, and just have it redirect to short.as/shorten or short.as/create */}
      <NavItem href="/shorten" text="Shorten" />
      <NavItem href="/about" text="About" />
    </nav>
  );
}