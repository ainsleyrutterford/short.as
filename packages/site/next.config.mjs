import createMDX from "@next/mdx";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

const basePath = "/create";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables static exports
  // https://nextjs.org/docs/app/building-your-application/deploying/static-exports#configuration
  output: "export",

  // This is required because in the CloudFront Distribution we serve website files only if the user
  // visits the '/create/*' path
  // https://nextjs.org/docs/app/api-reference/next-config-js/basePath
  basePath,
  // Also set it as an env variable so we can access it in the code: https://stackoverflow.com/a/77164437
  env: { basePath },

  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    // Add slugs (hrefs of headers) and autolinks to the headers
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: "rehype-autolink" } }],
    ],
  },
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
