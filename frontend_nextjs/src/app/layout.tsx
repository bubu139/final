import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppShell } from '@/components/app-shell';
import Script from 'next/script';
import { SupabaseClientProvider } from '@/supabase';

export const metadata: Metadata = {
  title: 'MathMentor',
  description: 'Nền tảng học toán kết hợp gia sư AI, mindmap và luyện đề cá nhân hóa.',
};

// Tách component client thành phần riêng
function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseClientProvider>
      <AppShell>
        {children}
      </AppShell>
      <Toaster />
    </SupabaseClientProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <Script id="mathjax-config">
          {`
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true
              },
              options: { 
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] 
              } 
            };
          `}
        </Script>
        <Script
          id="MathJax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          async
        />
      </head>
      <body className="font-body antialiased min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}