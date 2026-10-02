import type { Metadata } from "next";
import { satoshi } from "./fonts/satoshi";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "the round — Admin", template: "%s · the round admin" },
  description: "Founder dashboard for the round.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
