import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Assistant } from "@/components/assistant";
import { CommandPalette } from "@/components/command-palette";
import { WebMCPProvider } from "@/components/webmcp-provider";

const SITE = "https://techpulse.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "TECHPULSE — Everything happening in Tech, AI & Data",
    template: "%s · TECHPULSE",
  },
  description:
    "Discover the latest technology news, upcoming UK & online conferences, AI events and hackathons — all in one place. Stay Ahead. Build. Learn. Connect.",
  keywords: [
    "tech news",
    "AI events UK",
    "hackathons UK",
    "data science conferences",
    "LLM events",
    "machine learning hackathons",
  ],
  openGraph: {
    type: "website",
    siteName: "TECHPULSE",
    title: "TECHPULSE — Everything happening in Tech, AI & Data",
    description:
      "Tech news, UK & online events and AI hackathons in one place.",
    url: SITE,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <Footer />
          <Assistant />
          <CommandPalette />
          <WebMCPProvider />
        </Providers>
      </body>
    </html>
  );
}
