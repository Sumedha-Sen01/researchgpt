import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchGPT",
  description:
    "AI-powered research paper analysis and prompt optimization",
  applicationName: "ResearchGPT",
  generator: "ResearchGPT",

  icons: {
    icon: "/favicon.ico",
  },

  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}