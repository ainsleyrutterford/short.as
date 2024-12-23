import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { IdsProvider } from "@/contexts/ids";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "short.as",
  description: "Create short as links!",
};

// Prevents iOS zoom on inputs when focused since the text size is less than 16px
// https://github.com/shadcn-ui/ui/issues/2716
// https://github.com/tailwindlabs/tailwindcss/issues/1193#issuecomment-2063372605
export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      {/* #dfdbca, #8fb6d3, #bd99e5 */}
      <body className={inter.className}>
        <div
          style={{
            background:
              "radial-gradient(circle at right bottom, rgb(213, 201, 154), rgb(111, 169, 213), rgb(165, 111, 225)), radial-gradient(circle, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.85)), linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))",
            backgroundBlendMode: "overlay",
            opacity: 0.55,
            // backgroundAttachment: "fixed",
            height: "90vh",
            width: "100vw",
            position: "absolute",
            zIndex: -1,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SiteHeader />
            <IdsProvider>
              <div className="max-w-screen-md mx-auto px-4 pt-10 sm:pt-16">{children}</div>
            </IdsProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
