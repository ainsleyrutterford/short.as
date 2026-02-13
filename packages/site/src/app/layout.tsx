import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteHeader from "@/components/site-header";
import { IdsProvider } from "@/contexts/ids";
import { AuthProvider } from "@/contexts/auth";
import ReactQueryProvider from "@/contexts/react-query";

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs */}
        <link rel="manifest" href={`${process.env.basePath}/icons/manifest.webmanifest`} />
        <link rel="icon" href={`${process.env.basePath}/icons/favicon.ico`} sizes="32x32" />
        <link rel="icon" href={`${process.env.basePath}/icons/icon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${process.env.basePath}/icons/apple-icon.png`} />
      </head>
      {/* #dfdbca, #8fb6d3, #bd99e5 */}
      <body className={inter.className}>
        {/* <div
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
        /> */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <AuthProvider>
              <TooltipProvider>
                <SiteHeader />
                <IdsProvider>{children}</IdsProvider>
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
