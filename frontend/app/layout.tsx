import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const InterFont = Inter({
  variable: "--font-InterFont",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lets Draw!",
  description:
    "Lets Draw Together is a web app that lets u draw with your friends online!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${InterFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
