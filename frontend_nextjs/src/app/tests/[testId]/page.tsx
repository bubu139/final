// frontend_nextjs/src/app/tests/[testId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Test } from '@/types/test-schema';
import { TestRenderer } from '@/components/test/TestRenderer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/utils';

const testTitles: { [key: string]: string } = {
    'gkh1-2024': 'Đề kiểm tra giữa học kì 1 - 2024',
    'thptqg-2024-minhhoa': 'Đề minh họa THPT QG 2024',
};

export default function TestPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;

    // Lấy topic và difficulty từ URL hoặc dùng mặc định
    const topicFromUrl = searchParams.get('topic');
    const difficultyFromUrl = searchParams.get('difficulty');

    const [test, setTest] = useState<Test | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const topic = topicFromUrl || (testId ? testTitles[testId] : 'Bài kiểm tra tổng hợp');
    const difficulty = difficultyFromUrl || 'medium';

    // Tạo testId an toàn cho TestRenderer
    const safeTestId = testId || 'custom-test';

    useEffect(() => {
        const fetchTest = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/generate-test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, difficulty }),
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || errorData.error || 'Không thể tạo đề thi.');
                }
                const data = await response.json();

                if (!data.test) {
                    console.warn("No 'test' key in response:", data);
                    throw new Error('Dữ liệu đề thi không hợp lệ từ server.');
                }
                setTest(data.test);
            } catch (err: any) {
                console.error("Error fetching test:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (testId || topicFromUrl) {
            fetchTest();
        } else {
            setError("Không tìm thấy mã đề thi.");
            setIsLoading(false);
        }

    }, [testId, topic, difficulty, topicFromUrl]);

    const handleRetry = () => {
        if (testId || topicFromUrl) {
            const fetchTest = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${API_BASE_URL}/api/generate-test`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic, difficulty }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || errorData.error || 'Không thể tạo đề thi.');
                    }
                    const data = await response.json();
                    if (!data.test) {
                        throw new Error('Dữ liệu đề thi không hợp lệ từ server.');
                    }
                    setTest(data.test);
                } catch (err: any) {
                    console.error("Error fetching test:", err);
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTest();
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                 <Link href="/tests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>

                <h1 className="text-3xl font-bold mb-2">{topic}</h1>
                <p className="text-muted-foreground mb-8">
                    Một bài kiểm tra được tạo bởi AI để giúp bạn luyện tập.
                </p>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border rounded-lg bg-card">
                        <Loader className="w-12 h-12 animate-spin text-primary" />
                        <h2 className="text-xl font-semibold">AI đang tạo đề...</h2>
                        <p className="text-muted-foreground">
                           Quá trình này có thể mất một vài phút. Vui lòng chờ trong giây lát.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border border-destructive/50 rounded-lg bg-destructive/10">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <h2 className="text-xl font-semibold text-destructive">Đã xảy ra lỗi</h2>
                        <p className="text-destructive/80 max-w-md">
                            {error}
                        </p>
                         <Button onClick={handleRetry} variant="destructive">Thử lại</Button>
                    </div>
                )}

                {test && !isLoading && !error && (
                    <TestRenderer 
                        testData={test} 
                        onRetry={handleRetry}
                        testId={safeTestId}
                        topic={topic}
                        difficulty={difficulty}
                    />
                )}
            </div>
        </main>
    );
}