import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BrainCircuit, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-b from-slate-700 to-slate-900 tracking-tight">
          MindView Canvas
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Trực quan hóa kiến thức, trò chuyện cùng AI và luyện đề thông minh.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
        <Link href="/mindmap">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" /> Sơ đồ tư duy</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Khám phá và hệ thống hóa kiến thức toán học một cách trực quan thông qua các sơ đồ tư duy tương tác.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/chat">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="text-primary" /> Trợ lý AI</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Trò chuyện với gia sư AI để được giải đáp thắc mắc, nhận gợi ý và hướng dẫn học tập theo phương pháp Socratic.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tests">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="text-primary" /> Luyện đề</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Làm các bài kiểm tra được tạo bởi AI theo cấu trúc đề thi thật và nhận lộ trình ôn tập cá nhân hóa.</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Button asChild size="lg">
        <Link href="/mindmap">
          Bắt đầu khám phá <ArrowRight className="ml-2" />
        </Link>
      </Button>
    </main>
  );
}
