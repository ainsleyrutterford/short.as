import type { Metadata } from "next";

import Content from "@/markdown/privacy.mdx";
import { SimpleInformationPage } from "@/components/simple-info-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "The short.as Privacy Policy",
};

export default async function Privacy() {
  return <SimpleInformationPage content={<Content />} mdxPath="./src/markdown/privacy.mdx" />;
}
