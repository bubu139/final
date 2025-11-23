import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/app-shell";
import MathJaxConfig from "@/components/MathJaxConfig";

import { SupabaseClientProvider } from "@/supabase";

export const metadata: Metadata = {
  title: "Mathmentor",
  description: "An interactive mind map visualization tool.",
};

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseClientProvider>
      <AppShell>{children}</AppShell>
      <Toaster />
    </SupabaseClientProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen">
        <MathJaxConfig />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
