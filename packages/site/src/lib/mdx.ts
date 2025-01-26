import { remark } from "remark";
import remarkFlexibleToc, { TocItem } from "remark-flexible-toc";
import { read } from "to-vfile";

/**
 * https://github.com/ipikuka/remark-flexible-toc
 */
export const getTocFromMdx = async (path: string) => {
  const toc: TocItem[] = [];

  await remark()
    // Extract the table of contents into `toc`
    .use(remarkFlexibleToc, { tocRef: toc })
    .process(await read(path));

  return toc;
};
