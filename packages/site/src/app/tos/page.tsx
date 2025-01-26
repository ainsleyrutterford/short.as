import type { Metadata } from "next";

import Content from "@/markdown/tos.mdx";
import { SimpleInformationPage } from "@/components/simple-info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The short.as Terms of Service",
};

export default async function Tos() {
  return <SimpleInformationPage content={<Content />} mdxPath="./src/markdown/tos.mdx" />;
}
