
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from "next/link";

const tests = [
    {
        id: 'gkh1-2024',
        name: 'Đề kiểm tra giữa học kì 1 - 2024',
        description: 'Đề thi thử cho kỳ kiểm tra giữa học kỳ 1 môn Toán lớp 12.'
    },
    {
        id: 'thptqg-2024-minhhoa',
        name: 'Đề minh họa THPT QG 2024',
        description: 'Đề thi minh họa chính thức từ Bộ GD&ĐT cho kỳ thi tốt nghiệp THPT 2024.'
    }
]

export default function TestsPage() {
  return (
    <main className="flex flex-col items-center h-full w-full p-4 md:p-8">
        <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Danh sách bài kiểm tra</h1>
            <div className="grid gap-6 md:grid-cols-2">
                {tests.map((test) => (
                    <Link href={`/tests/${test.id}`} key={test.id}>
                        <Card className="hover:border-primary hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-start gap-3">
                                    <FileText className="text-primary mt-1 flex-shrink-0" />
                                    <span>{test.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{test.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    </main>
  );
}
