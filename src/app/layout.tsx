import type { Metadata, Viewport } from "next";
import { Poppins, Syne } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — planners & your second brain`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: "website" },
  icons: { icon: "/brand/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#121212" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${syne.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
