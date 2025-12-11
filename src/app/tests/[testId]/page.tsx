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

    // Lấy topic từ URL hoặc từ mapping
    const topicFromUrl = searchParams.get('topic');
    const topic = topicFromUrl || (testId ? testTitles[testId] : 'Bài kiểm tra tổng hợp');
    
    // Lấy difficulty từ URL (nếu có)
    const difficultyFromUrl = searchParams.get('difficulty');
    const difficulty = difficultyFromUrl || 'medium';

    const safeTestId = testId || 'custom-test';

    const [test, setTest] = useState<Test | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchTest = async () => {
            setIsLoading(true);
            setError(null);

            try {
                let response;
                let body: any = {}; // 👈 Tạo body request
                let endpoint = `${API_BASE_URL}/api/generate-test`; // 👈 Endpoint mặc định

                // Trường hợp 1: Test từ Node Mindmap
                if (nodeId && nodeTitle) {
                    // *** LƯU Ý: File custom-node-test/page.tsx của bạn đang gọi /api/generate-node-test
                    // *** Chúng ta sẽ hợp nhất logic đó vào đây, sử dụng endpoint /api/generate-test
                    endpoint = `${API_BASE_URL}/api/generate-test`; // (File này đang dùng endpoint khác, nhưng ta sẽ dùng endpoint chung)
                    body = {
                        topic: nodeTitle,
                        testType: "node", // 👈 Loại test mới
                        numQuestions: 5   // 👈 Số câu cho node test
                    };
                } 
                // Trường hợp 2: Test THPT QG
                else if (testId && testId.includes('thptqg')) {
                    body = {
                        topic: topic, // "Đề minh họa THPT QG 2024"
                        testType: "thptqg", // 👈 Loại test mới
                        numQuestions: 50    // 👈 Số câu THPTQG
                    };
                }
                // Trường hợp 3: Test tiêu chuẩn (ví dụ: Giữa kì)
                else {
                    body = {
                        topic: topic, // "Đề kiểm tra giữa học kì 1 - 2024"
                        testType: "standard", // 👈 Loại test mới
                        numQuestions: 6     // 👈 Số câu cho đề 3 phần (4+1+1)
                    };
                }

                // Gọi API
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body), // 👈 Gửi body đã chuẩn bị
                });
                

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

    }, [testId, nodeId, nodeTitle, topic, difficulty]); // Dependency array giữ nguyên

    const handleRetry = () => {
        // Cần cập nhật logic retry nếu muốn nó fetch lại
        // Đơn giản nhất là reload trang
        window.location.reload();
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
                        // Nếu là node test, thêm các prop này (nếu TestRenderer của bạn cần)
                        isNodeTest={!!nodeId}
                        nodeId={nodeId || undefined}
                    />
                )}
            </div>
        </main>
    );
}