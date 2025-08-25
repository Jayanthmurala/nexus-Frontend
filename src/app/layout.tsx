import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "Nexus",
  description: "NexusHub - Next.js migration",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
