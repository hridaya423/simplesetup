import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";

const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SimpleSetup — Self-host open-source tools with one command",
  description:
    "Deploy n8n, Umami, PostHog, and OpenClaw on your own hardware. One clean command, no Docker knowledge required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${monoFont.variable} ${bodyFont.variable} ${GeistPixelSquare.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
