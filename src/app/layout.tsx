import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "Contract Tracker",
  description: "Track contracts, quotas, and collection progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppNav />
        <main className="container mx-auto py-6">{children}</main>
      </body>
    </html>
  );
}
