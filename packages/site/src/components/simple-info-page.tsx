import { getTocFromMdx } from "@/lib/mdx";
import { SheetTableOfContents, TableOfContents } from "./toc";

export const SimpleInformationPage = async ({ content, mdxPath }: { content: JSX.Element; mdxPath: string }) => {
  const toc = await getTocFromMdx(mdxPath);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-10 pt-10 lg:pt-16 relative lg:gap-10 lg:py-10 lg:grid lg:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0 pb-40">{content}</div>

      {/* Floating table of contents for large screens */}
      <div className="hidden text-sm lg:block">
        <div className="sticky top-20 -mt-10 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-10">
          <p className="font-bold mb-2">On this page</p>
          <TableOfContents toc={toc} />
        </div>
      </div>

      <SheetTableOfContents toc={toc} />
    </main>
  );
};
