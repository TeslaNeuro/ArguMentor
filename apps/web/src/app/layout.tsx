import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4, Syne } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { SiteHeader } from "@/components/site-header";
import "@argumentor/ui/tokens.css";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArguMentor — AI Debate Partner",
  description:
    "Train with an elite AI debate opponent, get judged, and improve with a personal reasoning coach.",
  applicationName: "ArguMentor",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${sourceSerif.variable} ${plex.variable}`}>
      <body>
        <AppProviders>
          <div className="shell">
            <SiteHeader />
            <main>{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
