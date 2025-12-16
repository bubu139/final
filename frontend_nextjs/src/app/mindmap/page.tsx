"use client";

import { useEffect, useState, useMemo } from "react";
import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { NodeDetailDialog } from "@/components/mind-map/node-detail-dialog";
import { mindMapData } from "@/lib/mindmap-data";
import type { MindMapNode } from "@/types/mindmap";

// Import hàm xử lý storage để lấy kiến thức mới từ Chat
import { loadStoredMindmapInsights, mergeMindmapWithInsights } from "@/lib/mindmap-storage";

import { getNodeProgress } from "@/lib/nodeProgressApi";
import type { NodeProgress } from "@/lib/nodeProgressApi";

import { useUser } from "@/supabase/auth/use-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Network,
  ListTree,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. ĐỊNH NGHĨA INTERFACE QUAN TRỌNG ---
interface LearningPathItemProps {
  node: MindMapNode;
  level: number;
  progress: Record<string, NodeProgress>;
  onNodeClick: (node: MindMapNode) => void;
}
const DEMO_EMAIL = "hgtgd1903@gmail.com";
const DEMO_COMPLETED_CHAPTERS: Record<string, number> = {
  "khao-sat-ham-so": 3,
  "nguyen-ham-tich-phan": 1,
};
const DEMO_CHAPTERS = ["khao-sat-ham-so", "nguyen-ham-tich-phan"];

// --- 2. COMPONENT ĐỆ QUY HIỂN THỊ CÂY THƯ MỤC ---
const LearningPathItem = ({
  node,
  level,
  progress,
  onNodeClick,
}: LearningPathItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Kiểm tra an toàn xem node có con không
  const hasChildren = node.children && node.children.length > 0;
  
  const nodeProg = progress[node.id];
  const bestScore = nodeProg?.max_score ?? nodeProg?.score ?? 0;
  
  const isMastered = bestScore >= 80; // Xanh Lá
  const isLearning = !isMastered; // Vàng (mặc định)

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onNodeClick(node);
    }
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const StatusIcon = () => {
    if (isMastered) return <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />;
    return <PlayCircle className="w-5 h-5 text-yellow-500 fill-yellow-100" />;
  };

  return (
    <div className="w-full select-none">
      <div 
        className={cn(
          "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors border group",
          level === 0 ? "bg-white border-gray-200 hover:border-blue-300 shadow-sm" : "border-transparent hover:bg-slate-100/80",
          level > 0 && "ml-4 border-l-2 border-l-gray-100 border-y-0 border-r-0 rounded-none pl-4",
          isOpen && hasChildren && "bg-slate-50"
        )}
        onClick={handleRowClick}
      >
        <div className="mr-2 shrink-0">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-4 h-4" /> 
          )}
        </div>
        <div className="mr-3 shrink-0"><StatusIcon /></div>
        <div className="flex-1 min-w-0 mr-2">
          <h3 className={cn(
            "font-medium truncate",
            level === 0 ? "text-lg text-slate-800" : "text-sm text-slate-700",
            isLearning && "text-blue-700 font-semibold"
          )}>
            {node.label}
          </h3>
          {node.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{node.description}</p>
          )}
        </div>
        <Button 
            variant="ghost" size="sm" 
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" 
            onClick={handleOpenDetail}
        >
            <BookOpen className="w-4 h-4 text-blue-500" />
        </Button>
      </div>
      
      {/* Render các node con nếu đang mở */}
      {isOpen && hasChildren && (
        <div className="border-l border-dashed border-gray-200 ml-5 pl-1 animate-in slide-in-from-top-2 duration-200">
          {node.children?.map((child: MindMapNode) => (
            <LearningPathItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              progress={progress} 
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- 3. TRANG CHÍNH ---
export default function MindmapPage() {
  const { user } = useUser();
  const userId = user?.id || "";
const isDemoUser = user?.email === DEMO_EMAIL;
  const [viewMode, setViewMode] = useState<'mindmap' | 'path'>('mindmap');
  const [selectedChapter, setSelectedChapter] = useState<MindMapNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [progress, setProgress] = useState<Record<string, NodeProgress>>({});
  const [loading, setLoading] = useState(true);

  // State lưu cây dữ liệu đã được merge với insights mới
  const [treeData, setTreeData] = useState<MindMapNode>(mindMapData);

  // Effect tải insights từ localStorage và merge vào cây
  useEffect(() => {
    if (typeof window !== "undefined") {
        const storedInsights = loadStoredMindmapInsights();
        if (storedInsights && storedInsights.length > 0) {
          console.log("Found stored insights, merging...", storedInsights);
          const merged = mergeMindmapWithInsights(mindMapData, storedInsights);
          setTreeData(merged);
        } else {
          setTreeData(mindMapData);
        }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await getNodeProgress(userId);
        setProgress(data || {});
      } catch (error) {
        console.error("Failed to load node progress:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  async function handleNodeClick(node: MindMapNode) {
    setSelectedNode(node);
  }

  // Dùng treeData thay vì mindMapData gốc để có các node mới
  const subjects = useMemo(() => treeData.children || [], [treeData]);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Đang tải dữ liệu học tập...</p>
        </div>
    </div>
  );

  return (
    <div className="w-full h-full relative bg-slate-50/50">

      <div className="w-full max-w-6xl mx-auto px-4 pt-6 grid gap-3 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trạng thái node - Lộ trình học</CardTitle>
            <CardDescription>
              Trong chế độ <strong>Lộ trình học</strong>: Tất cả node mặc định màu vàng (đang học). Sau khi làm bài kiểm tra đạt ≥ 80 điểm, node sẽ chuyển sang màu xanh lá (đã thành thạo).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <PlayCircle className="w-4 h-4 text-yellow-500" /> Đang học (mặc định)
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Đã thành thạo (≥ 80 điểm)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-800">Sơ đồ tư duy</CardTitle>
            <CardDescription className="text-blue-700">
              Trong chế độ <strong>Sơ đồ tư duy</strong>: Node giữ màu xanh dương mặc định, không thay đổi theo điểm số.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      {viewMode === 'path' && (
        <div className="w-full h-full max-w-4xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-lg"><ListTree className="w-6 h-6 text-blue-600" /></div>
               Lộ trình học cá nhân
            </h1>
            <p className="text-slate-500 mt-1 ml-1">Theo dõi tiến độ và học tập theo trình tự từng bước.</p>
          </div>
          <ScrollArea className="flex-1 pr-4 -mr-4">
             <div className="pb-24 pl-1">
                {subjects.map((subject: MindMapNode) => (
                  <div key={subject.id} className="mb-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                      {subject.label}
                    </h2>
                    <div className="space-y-1">
                        {subject.children?.map((chapter: MindMapNode) => (
                        <LearningPathItem 
                            key={chapter.id} node={chapter} level={0}
                            progress={progress} onNodeClick={handleNodeClick}
                        />
                        ))}
                    </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
        </div>
      )}

      {viewMode === 'mindmap' && (
        <div className="w-full h-full">
            {!selectedChapter ? (
                <div className="w-full h-full p-4 md:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-10 text-center space-y-2">
                            <h1 className="text-3xl font-bold text-slate-800">Thư viện kiến thức Toán 12</h1>
                            <p className="text-slate-500 max-w-lg mx-auto">Chọn một chương để khám phá kiến thức.</p>
                        </div>
                        <Tabs defaultValue={subjects[0]?.id} className="w-full">
                            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 p-1 bg-slate-200/50">
                                {subjects.map((sub: MindMapNode) => (
                                    <TabsTrigger key={sub.id} value={sub.id} className="h-full text-base">{sub.label}</TabsTrigger>
                                ))}
                            </TabsList>
                            {subjects.map((subject: MindMapNode) => (
                                <TabsContent key={subject.id} value={subject.id}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {subject.children?.map((chapter: MindMapNode) => {
                                            const totalNodes = chapter.children?.length || 0;
// kiểm tra chapter có phải là chapter demo không
const isDemoChapter = DEMO_CHAPTERS.includes(chapter.id);

// số hoàn thành thực tế từ progress
const realCompleted = chapter.children?.filter((c: MindMapNode) => {
  const p = progress[c.id];
  const score = p?.max_score ?? p?.score ?? 0;
  return score >= 80;
}).length ?? 0;

// hiển thị số hoàn thành: nếu là user demo và chapter demo → hiển thị số demo
const displayCompleted = isDemoChapter && isDemoUser
  ? DEMO_COMPLETED_CHAPTERS[chapter.id]   // chỉ user demo thấy 3/7 hoặc 1/3
  : realCompleted;



                                            
                                            return (
                                                <Card key={chapter.id} className="cursor-pointer hover:shadow-lg transition-all group border-slate-200 hover:border-blue-400" onClick={() => setSelectedChapter(chapter)}>
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-lg group-hover:text-blue-700">{chapter.label}</CardTitle>
                                                        <CardDescription>{totalNodes} chủ đề chính</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 p-2 rounded-md">
                                                            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /><span>Hoàn thành:</span></div>
                                                            <span className="font-semibold text-slate-700">{displayCompleted} / {totalNodes}</span>

                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full relative bg-white">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur p-1.5 pr-4 rounded-lg shadow-sm border border-slate-200">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedChapter(null)} className="gap-2 hover:bg-slate-100">
                            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Quay lại</span>
                        </Button>
                        <div className="h-4 w-px bg-slate-300 mx-1" />
                        <span className="font-semibold text-slate-700 text-sm max-w-[200px] truncate">{selectedChapter.label}</span>
                    </div>
                    <MindMapCanvas
                        data={selectedChapter}
                        progress={progress}
                        selectedNodeId={selectedNode?.id ?? null}
                        onNodeClick={handleNodeClick}
                    />
                </div>
            )}
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
         <div className="bg-white p-1.5 rounded-full shadow-xl border border-slate-200 flex flex-col gap-2">
            <Button variant={viewMode === 'mindmap' ? 'default' : 'ghost'} size="icon" className="rounded-full w-12 h-12" onClick={() => setViewMode('mindmap')} title="Mindmap"><Network className="w-6 h-6" /></Button>
            <Button variant={viewMode === 'path' ? 'default' : 'ghost'} size="icon" className="rounded-full w-12 h-12" onClick={() => setViewMode('path')} title="Lộ trình"><ListTree className="w-6 h-6" /></Button>
         </div>
      </div>

      {selectedNode && (
        <NodeDetailDialog
          isOpen
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          currentProgress={progress[selectedNode.id]} 
        />
      )}
    </div>
  );
}