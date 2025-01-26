import type { MDXComponents } from "mdx/types";
import { cn } from "./lib/utils";
import { LinkIcon } from "lucide-react";

/**
 * Required by NextJS to allow us to render .mdx files:
 * - https://nextjs.org/docs/app/building-your-application/configuring/mdx#add-an-mdx-componentstsx-file
 *
 * Used the styling from the Shadcn docs:
 * - https://github.com/shadcn-ui/ui/blob/main/apps/www/components/mdx-components.tsx
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className={cn("font-heading mt-2 scroll-m-20 text-3xl font-bold", className)} {...props} />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        className={cn(
          "font-heading mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className={cn("font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props} />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className={cn("font-heading mt-8 scroll-m-20 text-lg font-semibold tracking-tight", className)} {...props} />
    ),
    h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5 className={cn("mt-8 scroll-m-20 text-lg font-semibold tracking-tight", className)} {...props} />
    ),
    h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6 className={cn("mt-8 scroll-m-20 text-base font-semibold tracking-tight", className)} {...props} />
    ),
    a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
      // This has some custom styling so that the rehype autolinks aren't styled like normal links
      <a
        className={cn(
          // Check if it's an autolink
          className?.includes("rehype-autolink")
            ? // Add group class to apply hover effect to the <a>
              "relative no-underline group"
            : // Default styling for other links
              "font-medium underline underline-offset-4",
          className,
        )}
        {...props}
      >
        {props.children}
        {className?.includes("rehype-autolink") && (
          <span className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:inline-block transition-opacity">
            <LinkIcon className="ml-1 inline-block text-gray-500 h-5 w-5" />
          </span>
        )}
      </a>
    ),
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
    ),
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <li className={cn("mt-2", className)} {...props} />
    ),
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
    ),
    img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img className={cn("rounded-md", className)} alt={alt} {...props} />
    ),
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => <hr className="my-4 md:my-8" {...props} />,
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn("relative w-full overflow-hidden border-none text-sm", className)} {...props} />
      </div>
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className={cn("last:border-b-none m-0 border-b", className)} {...props} />
    ),
    th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th
        className={cn(
          "px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
          className,
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td
        className={cn("px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right", className)}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre className={cn("mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4", className)} {...props} />
    ),
    code: ({ className, ...props }) => (
      <code className={cn("relative rounded border px-[0.3rem] py-[0.2rem] font-mono text-sm", className)} {...props} />
    ),
    ...components,
  };
}
