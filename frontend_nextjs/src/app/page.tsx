import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BrainCircuit, MessageSquare, FileText, UserRound, GitMerge, ShieldCheck, Sparkles, FileUp } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Trợ lý AI tư duy Socratic",
    description:
      "Phân tích câu hỏi bằng RAG, tham chiếu tri thức Supabase và Gemini để đưa ra gợi ý từng bước, trình bày theo Latex rõ ràng.",
    icon: MessageSquare,
    href: "/chat",
    cta: "Bắt đầu trao đổi",
  },
  {
    title: "Mindmap cá nhân hóa",
    description:
      "Thu thập dữ liệu điểm mạnh-yếu và gợi ý lộ trình học bằng sơ đồ tư duy trực quan. Mỗi node mở ra ghi chú, tài liệu và bài tập.",
    icon: BrainCircuit,
    href: "/mindmap",
    cta: "Xem lộ trình",
  },
  {
    title: "Kho đề thông minh",
    description:
      "Sinh đề thường xuyên, giữa kì, cuối kì và THPTQG dựa trên hồ sơ học tập. Sau mỗi lần nộp bài AI phân tích lại để tinh chỉnh đề sau.",
    icon: FileText,
    href: "/tests",
    cta: "Luyện đề ngay",
  },
  {
    title: "Kho tài liệu cá nhân",
    description:
      "Upload file PDF/DOCX, hệ thống tự động lập chỉ mục trên Supabase và sẵn sàng cho pipeline RAG khi bạn dùng AI chat.",
    icon: FileUp,
    href: "/library",
    cta: "Tải tài liệu",
  },
  {
    title: "Trang cá nhân MathMentor",
    description:
      "Tổng hợp tiến độ, biểu đồ kĩ năng, lịch sử bài làm và các mục tiêu mới để giáo viên và học sinh cùng theo dõi.",
    icon: UserRound,
    href: "/user",
    cta: "Xem dashboard",
  },
];

const pipelines = [
  {
    title: "Luồng 1: Trả lời có kiểm chứng",
    description:
      "Ngay sau khi nhận câu hỏi, MathMentor chạy RAG để truy xuất tài liệu (bao gồm file bạn upload), sau đó gọi Gemini để tổng hợp lời giải Socratic, kiểm tra chéo với dữ liệu Google và trình bày theo cấu trúc mục lớn/nhỏ rõ ràng.",
  },
  {
    title: "Luồng 2: Sinh lệnh GeoGebra",
    description:
      "Luồng song song nhận diện bài toán có đồ thị hoặc hình học, suy luận cách dựng hình, tạo duy nhất chuỗi câu lệnh GeoGebra và chỉ reset canvas khi bạn chuyển sang bài mới hoặc yêu cầu chỉnh sửa.",
  },
  {
    title: "Đồng bộ Mindmap & kiểm tra",
    description:
      "Điểm mạnh/yếu, kiến thức cần học được ghi nhận liên tục để cập nhật mindmap, gợi ý bài tập và tự động điều chỉnh ngân hàng đề.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center max-w-3xl mb-12 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">MathMentor</p>
        <h1 className="text-4xl md:text-6xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-950 tracking-tight">
          Nền tảng gia sư toán toàn diện
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Kết nối AI Gemini, GeoGebra và Supabase để đồng hành cùng học sinh: từ giải đáp bài tập, vẽ hình, xây dựng mindmap đến
          tạo bài kiểm tra phù hợp năng lực và bảng điều khiển cá nhân hóa.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/chat">
              Bắt đầu với trợ lý AI <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/mindmap">Khám phá lộ trình học</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col justify-between border-primary/10 shadow-sm hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <feature.icon className="text-primary" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{feature.description}</CardDescription>
              <Button asChild variant="ghost" className="justify-start px-0 font-semibold text-primary hover:text-primary">
                <Link href={feature.href}>
                  {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Cách MathMentor vận hành</p>
          <h2 className="text-3xl font-headline font-bold">Luồng dữ liệu song song</h2>
          <p className="text-muted-foreground">
            Từ một tin nhắn duy nhất, hệ thống tạo ra cả hướng dẫn học tập lẫn bản vẽ hình học, đồng thời cập nhật dữ liệu phục vụ mindmap và bộ đề.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pipelines.map((item, index) => (
            <Card key={item.title} className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-4xl font-black text-primary/20">{index + 1}</div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {index === 0 && <GitMerge className="text-primary" />}
                  {index === 1 && <ShieldCheck className="text-primary" />}
                  {index === 2 && <Sparkles className="text-primary" />}
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
