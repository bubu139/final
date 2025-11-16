'use client';

import { useState, useEffect } from 'react';
import { Loader, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Test } from '@/types/test-schema';
import { TestRenderer } from '@/components/test/TestRenderer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/utils';

// ----------- GIỮ NGUYÊN MAPPING CŨ -----------
const testTitles: { [key: string]: string } = {
    'gkh1-2024': 'Đề kiểm tra giữa học kì 1 - 2024',
    'thptqg-2024-minhhoa': 'Đề minh họa THPT QG 2024',
};

export default function TestPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();

    const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;

    const nodeId = searchParams.get("nodeId");
    const nodeTitle = searchParams.get("title");

    const topicFromUrl = searchParams.get('topic');
    const difficultyFromUrl = searchParams.get('difficulty');

    const [test, setTest] = useState<Test | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const topic = topicFromUrl || (testId ? testTitles[testId] : 'Bài kiểm tra tổng hợp');
    const difficulty = difficultyFromUrl || 'medium';

    const safeTestId = testId || 'custom-test';

    useEffect(() => {
        const fetchTest = async () => {
            setIsLoading(true);
            setError(null);

            try {
                let response;

                if (nodeId && nodeTitle) {
                    response = await fetch(`${API_BASE_URL}/api/generate-node-test`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ topic: nodeTitle }),
                    });
                } else {
                    response = await fetch(`${API_BASE_URL}/api/generate-test`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic, difficulty }),
                    });
                }

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || errData.error || "Không thể tạo đề thi.");
                }

                const data = await response.json();
                const testData = data.test || data;
                setTest(testData);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTest();

    }, [testId, nodeId, nodeTitle, topic, difficulty]);

    const handleRetry = () => {
        setTest(null);
        setError(null);
        setIsLoading(true);
    };

    return (
        <main className="flex-1 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                <Link href="/tests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </Link>

                <h1 className="text-3xl font-bold mb-2">
                    {nodeId ? `Bài kiểm tra: ${nodeTitle}` : topic}
                </h1>

                <p className="text-muted-foreground mb-8">
                    {nodeId
                        ? "Bài kiểm tra theo nội dung bạn đang học."
                        : "Một bài kiểm tra được tạo bởi AI để luyện tập."}
                </p>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border rounded-lg bg-card">
                        <Loader className="w-12 h-12 animate-spin text-primary" />
                        <h2 className="text-xl font-semibold">AI đang tạo đề...</h2>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border border-destructive/50 rounded-lg bg-destructive/10">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <h2 className="text-xl font-semibold text-destructive">Đã xảy ra lỗi</h2>
                        <p className="text-destructive/80 max-w-md">{error}</p>
                        <Button onClick={handleRetry} variant="destructive">Thử lại</Button>
                    </div>
                )}

                {test && !isLoading && !error && (
                    <TestRenderer
                        testData={test}
                        onRetry={handleRetry}
                        testId={safeTestId}
                        topic={nodeId ? nodeTitle! : topic}
                        difficulty={difficulty}
                    />
                )}
            </div>
        </main>
    );
}
