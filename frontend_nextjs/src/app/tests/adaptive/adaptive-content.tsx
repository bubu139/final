// frontend_nextjs/src/app/tests/adaptive/adaptive-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import { TestRenderer } from '@/components/test/TestRenderer';
import type { Test } from '@/types/test-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, AlertTriangle, Target, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/utils';

export default function AdaptiveTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();

  const [test, setTest] = useState<Test | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !isInitialized) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (supabaseError) {
      setError(supabaseError);
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setError('Không thể kết nối tới Supabase. Vui lòng thử lại sau.');
      setIsLoading(false);
      return;
    }

    const loadAdaptiveTest = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get topics from URL or analyze user history
        let topicsToFocus: string[] = [];
        const topicsParam = searchParams.get('topics');

        if (topicsParam) {
          topicsToFocus = topicsParam.split(',');
        } else {
          // Analyze user history to find weak topics
          const historyService = new TestHistoryService(supabase);
          const analysis = await historyService.analyzeWeakTopics(user.id);

          if (analysis.weakTopics.length === 0) {
            throw new Error('Bạn chưa có điểm yếu rõ ràng. Hãy làm thêm một vài bài kiểm tra!');
          }

          topicsToFocus = analysis.weakTopics.slice(0, 3).map(t => t.topic);
        }

        setWeakTopics(topicsToFocus);

        // Generate adaptive test
        const response = await fetch(`${API_BASE_URL}/api/generate-adaptive-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            weakTopics: topicsToFocus,
            difficulty: 'medium',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Không thể tạo đề thi thích ứng');
        }

        const data = await response.json();
        setTest(data.test);

      } catch (err: any) {
        console.error('Error generating adaptive test:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdaptiveTest();
  }, [user, isUserLoading, isInitialized, supabase, supabaseError, router, searchParams]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isUserLoading || isLoading) {
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

          <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border rounded-lg bg-card">
            <Loader className="w-12 h-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">AI đang tạo đề thích ứng...</h2>
            <p className="text-muted-foreground max-w-md">
              Hệ thống đang phân tích điểm yếu của bạn và tạo đề thi phù hợp. 
              Vui lòng chờ trong giây lát.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
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

          <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border border-destructive/50 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">Đã xảy ra lỗi</h2>
            <p className="text-destructive/80 max-w-md">{error}</p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="destructive">
                Thử lại
              </Button>
              <Button asChild variant="outline">
                <Link href="/tests">Làm đề thường</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!test) {
    return (
      <main className="flex items-center justify-center h-full">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

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

        {/* Header */}
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="text-purple-500" />
                  Đề thi thích ứng AI
                </CardTitle>
                <CardDescription className="mt-2">
                  Đề thi này được tạo riêng cho bạn, tập trung vào các chủ đề cần cải thiện
                </CardDescription>
              </div>
              <Badge className="bg-purple-500 text-white">
                <Target className="w-4 h-4 mr-1" />
                Thích ứng
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Chủ đề trọng tâm:</p>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((topic, idx) => (
                  <Badge key={idx} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test */}
        <TestRenderer
          testData={test}
          onRetry={handleRetry}
          testId="adaptive"
          topic={`Đề thích ứng: ${weakTopics.join(', ')}`}
          difficulty="adaptive"
        />
      </div>
    </main>
  );
}