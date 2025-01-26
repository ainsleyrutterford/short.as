"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { TocItem } from "remark-flexible-toc";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { TableOfContentsIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TreeNode {
  value: string;
  href: string;
  depth: number;
  children: TreeNode[];
}

/**
 * Construct a tree structure that has a depth of 2 (only look at <h2> and <h3> elements)
 */
const constructTree = (toc: TocItem[]): TreeNode[] => {
  const tree: TreeNode[] = [];

  toc.forEach(({ value, href, depth }) => {
    if (depth === 2) {
      tree.push({ value, href, depth, children: [] });
    } else if (depth === 3) {
      // If the first header seen is an h3, then just turn it into an h2
      if (tree.length === 0) {
        tree.push({ value, href, depth: 2, children: [] });
      } else {
        tree[tree.length - 1].children.push({ value, href, depth, children: [] });
      }
    }
  });

  return tree;
};

interface TreeProps {
  tree: TreeNode[];
  level?: number;
  activeHeading?: string;
}

/**
 * Taken from Shadcn and modified to work with our TreeNode type:
 * - https://github.com/shadcn-ui/ui/blob/main/apps/www/components/toc.tsx#L82
 */
const Tree = ({ tree, level = 1, activeHeading }: TreeProps) => {
  return tree.length && level < 3 ? (
    <ul className={cn("m-0 list-none", { "pl-4": level !== 1 })}>
      {tree.map((item, index) => {
        return (
          <li key={index} className={cn("mt-0 pt-2 text-sm")}>
            <a
              href={item.href}
              className={cn(
                "inline-block no-underline transition-colors hover:text-foreground",
                item.href === `#${activeHeading}` ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {item.value}
            </a>
            {item.children.length ? (
              <Tree tree={item.children} level={level + 1} activeHeading={activeHeading} />
            ) : null}
          </li>
        );
      })}
    </ul>
  ) : null;
};

/**
 * Taken from Shadcn and modified to work with our TreeNode type:
 * - https://github.com/shadcn-ui/ui/blob/main/apps/www/components/toc.tsx#L41
 */
const useActiveHeading = (headingHrefs: string[]) => {
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: `0% 0% -80% 0%` },
    );

    headingHrefs?.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headingHrefs?.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headingHrefs]);

  return activeId;
};

export const TableOfContents = ({ toc }: { toc: TocItem[] }) => {
  const tree = constructTree(toc);

  const headingHrefs = React.useMemo(
    () =>
      tree
        .flatMap((h2) => [h2.href, h2.children.map((h3) => h3.href)])
        .flat()
        .map((id) => id.split("#")?.[1]),
    [tree],
  );

  const activeHeading = useActiveHeading(headingHrefs);

  return (
    <div>
      <Tree tree={tree} activeHeading={activeHeading} />
    </div>
  );
};

/**
 * Floating button to show the table of contents for small screens
 */
export const SheetTableOfContents = ({ toc }: { toc: TocItem[] }) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [open, setOpen] = React.useState(false);

  return !isDesktop ? (
    <Sheet open={open} onOpenChange={(newState) => setOpen(newState)}>
      <div className="fixed bottom-5 right-5 z-50 lg:hidden">
        <SheetTrigger asChild>
          <Button variant="outline" size="largeIcon" className="rounded-full">
            <TableOfContentsIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent onClick={() => setOpen(false)}>
        <SheetHeader>
          <SheetTitle className="text-left text-sm">On this page</SheetTitle>
        </SheetHeader>
        <TableOfContents toc={toc} />
      </SheetContent>
    </Sheet>
  ) : null;
};
