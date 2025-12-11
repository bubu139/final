// frontend_nextjs/src/app/tests/adaptive/page.tsx
import { Suspense, ReactNode } from 'react';
import { Metadata } from 'next';
import AdaptiveTestContent from './adaptive-content';
import { Loader, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đề Thi Thích Ứng AI | Riel',
  description: 'Làm bài test thích ứng được tạo riêng theo điểm yếu của bạn',
  openGraph: {
    title: 'Đề Thi Thích Ứng AI',
    description: 'Làm bài test thích ứng được tạo riêng theo điểm yếu của bạn',
    type: 'website',
  },
};

/**
 * Fallback UI khi loading
 */
function AdaptiveTestFallback(): ReactNode {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/test-history" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lịch sử
        </Link>

        <Card>
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <div className="flex items-center justify-center">
                <Loader className="w-12 h-12 animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Đang tải...</h2>
              <p className="text-muted-foreground max-w-md">
                Vui lòng chờ trong giây lát.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/**
 * Error Boundary Fallback
 */
function AdaptiveTestError({ error }: { error: Error }): ReactNode {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/test-history" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lịch sử
        </Link>

        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <h2 className="text-xl font-semibold text-destructive">
                Đã xảy ra lỗi
              </h2>
              <p className="text-destructive/80 max-w-md">
                {error?.message || 'Không thể tải trang. Vui lòng thử lại.'}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Link 
                  href="/tests/adaptive" 
                  className="inline-flex items-center justify-center px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
                >
                  Thử lại
                </Link>
                <Link 
                  href="/tests" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-input rounded-lg hover:bg-muted"
                >
                  Làm đề thường
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/**
 * Adaptive Test Page - Server Component
 * Sử dụng Suspense để xử lý useSearchParams() trong client component
 */
export default function AdaptiveTestPage(): ReactNode {
  return (
    <Suspense fallback={<AdaptiveTestFallback />}>
      <ErrorBoundaryWrapper>
        <AdaptiveTestContent />
      </ErrorBoundaryWrapper>
    </Suspense>
  );
}

/**
 * Simple Error Boundary Component
 */
function ErrorBoundaryWrapper({ children }: { children: ReactNode }): ReactNode {
  // Note: React Server Components không có Error Boundary support
  // Đây chỉ là wrapper để documentation, thực tế xử lý error ở client side
  return children;
}