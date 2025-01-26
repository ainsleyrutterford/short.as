import type { Metadata } from "next";

import Content from "@/markdown/about.mdx";
import { SimpleInformationPage } from "@/components/simple-info-page";

export const metadata: Metadata = {
  title: "About",
  description: "About short.as",
};

export default async function About() {
  return <SimpleInformationPage content={<Content />} mdxPath="./src/markdown/about.mdx" />;
}
