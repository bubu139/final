"use client";

import { useEffect, useState, useMemo } from "react";
import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { NodeDetailDialog } from "@/components/mind-map/node-detail-dialog";
import { mindMapData } from "@/lib/mindmap-data";
import type { MindMapNode } from "@/types/mindmap";

import {
  getNodeProgress,
  openNode,
  NodeProgress,
} from "@/lib/nodeProgressApi";

import { useUser } from "@/supabase/auth/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Network, 
  ListTree, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown, 
  BookOpen,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// =================================================
// COMPONENT: LEARNING PATH ITEM (Recursive)
// =================================================
interface LearningPathItemProps {
  node: MindMapNode;
  level: number;
  progress: Record<string, NodeProgress>;
  onNodeClick: (node: MindMapNode) => void;
}

const LearningPathItem = ({ node, level, progress, onNodeClick }: LearningPathItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Xác định trạng thái từ dữ liệu progress
  const nodeProgress = progress[node.id];
  // Đã master nếu điểm >= 80
  const isMastered = nodeProgress?.score !== undefined && nodeProgress.score !== null && nodeProgress.score >= 80;
  // Đang học nếu đã có record (đã click vào) nhưng chưa master
  const isLearning = nodeProgress && !isMastered;
  
  // Xử lý click vào hàng (Row Click):
  // - Nếu có con: Toggle đóng/mở
  // - Nếu không có con (lá): Mở popup
  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      onNodeClick(node);
    }
  };

  // Xử lý click nút Mở chi tiết (Button Click):
  // - Luôn mở popup cho mọi loại node (kể cả node cha)
  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  // Icon trạng thái
  const StatusIcon = () => {
    if (isMastered) return <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100" />;
    if (isLearning) return <PlayCircle className="w-5 h-5 text-yellow-500 fill-yellow-100" />;
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className="w-full select-none">
      <div 
        className={cn(
          "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors border group",
          level === 0 ? "bg-white border-gray-200 hover:border-blue-300 shadow-sm" : "border-transparent hover:bg-slate-100/80",
          level > 0 && "ml-4 border-l-2 border-l-gray-100 border-y-0 border-r-0 rounded-none pl-4",
          // Highlight nhẹ nếu đang mở
          isOpen && hasChildren && "bg-slate-50"
        )}
        onClick={handleRowClick}
      >
        {/* Icon mũi tên expand/collapse */}
        <div className="mr-2 shrink-0">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-4 h-4" /> // Spacer
          )}
        </div>
        
        {/* Icon trạng thái (Xanh/Vàng/Xám) */}
        <div className="mr-3 shrink-0">
            <StatusIcon />
        </div>

        {/* Nội dung text */}
        <div className="flex-1 min-w-0 mr-2">
          <h3 className={cn(
            "font-medium truncate",
            level === 0 ? "text-lg text-slate-800" : "text-sm text-slate-700",
            isLearning && "text-blue-700 font-semibold" // Highlight text nếu đang học
          )}>
            {node.label}
          </h3>
          {node.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{node.description}</p>
          )}
        </div>

        {/* Nút Action: Luôn hiển thị nút này để mở popup cho BẤT KỲ node nào */}
        <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" 
            onClick={handleOpenDetail}
            title="Mở chi tiết & Bài tập"
        >
            <BookOpen className="w-4 h-4 text-blue-500" />
        </Button>
      </div>

      {/* Render con đệ quy */}
      {isOpen && hasChildren && (
        <div className="border-l border-dashed border-gray-200 ml-5 pl-1 animate-in slide-in-from-top-2 duration-200">
          {node.children.map((child) => (
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

// =================================================
// MAIN PAGE COMPONENT
// =================================================
export default function MindmapPage() {
  const { user } = useUser();
  const userId = user?.id || "";

  // View Mode: 'mindmap' (Sơ đồ tư duy) | 'path' (Lộ trình học)
  const [viewMode, setViewMode] = useState<'mindmap' | 'path'>('mindmap');
  
  // State cho Mindmap: Chọn chương để hiển thị
  const [selectedChapter, setSelectedChapter] = useState<MindMapNode | null>(null);

  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  
  // progress: Record<nodeId, NodeProgress>
  const [progress, setProgress] = useState<Record<string, NodeProgress>>({});
  const [loading, setLoading] = useState(true);

  // =================================================
  // LOAD PROGRESS TỪ SUPABASE
  // =================================================
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

  // =================================================
  // HANDLE CLICK NODE (Dùng chung cho cả 2 chế độ)
  // =================================================
  async function handleNodeClick(node: MindMapNode) {
    setSelectedNode(node);

    // Nếu đã có trong progress (đã từng mở), giữ nguyên, không reset điểm.
    // Màu sắc sẽ tự hiển thị dựa trên progress hiện có.
    if (progress[node.id]) {
      return;
    }

    // Nếu chưa học (chưa có record) -> Gọi API tạo record mới (status: learning, score: 0)
    // Việc này đảm bảo khi F5 lại trang, node này vẫn có màu vàng (đang học).
    try {
      const updated = await openNode(userId, node.id);
      
      // Cập nhật state local ngay lập tức
      setProgress((prev) => ({
        ...prev,
        [node.id]: updated,
      }));
    } catch (error) {
      console.error("Lỗi khi mở node:", error);
    }
  }

  // Tách dữ liệu thành các môn (Giải tích, Hình học) cho màn hình chọn chương
  const subjects = useMemo(() => {
    return mindMapData.children || [];
  }, []);

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
      
      {/* =========================================================
          VIEW MODE: LEARNING PATH (LỘ TRÌNH HỌC)
         ========================================================= */}
      {viewMode === 'path' && (
        <div className="w-full h-full max-w-4xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-lg">
                 <ListTree className="w-6 h-6 text-blue-600" />
               </div>
               Lộ trình học cá nhân
            </h1>
            <p className="text-slate-500 mt-1 ml-1">Theo dõi tiến độ và học tập theo trình tự từng bước.</p>
          </div>

          <ScrollArea className="flex-1 pr-4 -mr-4">
             <div className="pb-24 pl-1">
                {subjects.map(subject => (
                  <div key={subject.id} className="mb-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                      {subject.label}
                    </h2>
                    <div className="space-y-1">
                        {subject.children.map(chapter => (
                        <LearningPathItem 
                            key={chapter.id}
                            node={chapter}
                            level={0}
                            progress={progress}
                            onNodeClick={handleNodeClick}
                        />
                        ))}
                    </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
        </div>
      )}

      {/* =========================================================
          VIEW MODE: MIND MAP (SƠ ĐỒ TƯ DUY)
         ========================================================= */}
      {viewMode === 'mindmap' && (
        <div className="w-full h-full">
            {/* TRƯỜNG HỢP 1: CHƯA CHỌN CHƯƠNG -> HIỂN THỊ DANH SÁCH CHƯƠNG */}
            {!selectedChapter ? (
                <div className="w-full h-full p-4 md:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-10 text-center space-y-2">
                            <h1 className="text-3xl font-bold text-slate-800">Thư viện kiến thức Toán 12</h1>
                            <p className="text-slate-500 max-w-lg mx-auto">
                                Chọn một chương để khám phá kiến thức dưới dạng sơ đồ tư duy trực quan.
                            </p>
                        </div>

                        <Tabs defaultValue={subjects[0]?.id} className="w-full">
                            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 p-1 bg-slate-200/50">
                                {subjects.map(sub => (
                                    <TabsTrigger 
                                        key={sub.id} 
                                        value={sub.id}
                                        className="h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-base"
                                    >
                                        {sub.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            
                            {subjects.map(subject => (
                                <TabsContent key={subject.id} value={subject.id} className="animate-in fade-in-50 duration-300 focus-visible:outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {subject.children.map(chapter => {
                                            // Tính toán nhanh tiến độ chương
                                            const totalNodes = chapter.children?.length || 0; // (Chỉ đếm cấp con trực tiếp để hiển thị sơ bộ)
                                            const completedNodes = chapter.children?.filter(c => progress[c.id]?.score && progress[c.id].score! >= 80).length || 0;
                                            
                                            return (
                                                <Card 
                                                    key={chapter.id} 
                                                    className="cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-blue-400 group overflow-hidden"
                                                    onClick={() => setSelectedChapter(chapter)}
                                                >
                                                    <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-lg group-hover:text-blue-700 transition-colors leading-tight">
                                                            {chapter.label}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {chapter.children?.length || 0} chủ đề chính
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 p-2 rounded-md">
                                                            <div className="flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                <span>Hoàn thành:</span>
                                                            </div>
                                                            <span className="font-semibold text-slate-700">{completedNodes} / {totalNodes}</span>
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
                /* TRƯỜNG HỢP 2: ĐÃ CHỌN CHƯƠNG -> HIỂN THỊ CANVAS */
                <div className="w-full h-full relative bg-white">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur p-1.5 pr-4 rounded-lg shadow-sm border border-slate-200">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedChapter(null)}
                            className="gap-2 hover:bg-slate-100"
                        >
                            <ArrowLeft className="w-4 h-4" /> 
                            <span className="hidden sm:inline">Quay lại</span>
                        </Button>
                        <div className="h-4 w-px bg-slate-300 mx-1" />
                        <span className="font-semibold text-slate-700 text-sm max-w-[200px] sm:max-w-md truncate" title={selectedChapter.label}>
                            {selectedChapter.label}
                        </span>
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

      {/* =========================================================
          FLOATING MODE SWITCHER (NÚT CHUYỂN CHẾ ĐỘ)
         ========================================================= */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
         <div className="bg-white p-1.5 rounded-full shadow-xl border border-slate-200 flex flex-col gap-2">
            <Button
                variant={viewMode === 'mindmap' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                    "rounded-full w-12 h-12 transition-all",
                    viewMode === 'mindmap' ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "hover:bg-slate-100 text-slate-500"
                )}
                onClick={() => setViewMode('mindmap')}
                title="Chế độ Sơ đồ tư duy"
            >
                <Network className="w-6 h-6" />
            </Button>
            <Button
                variant={viewMode === 'path' ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                    "rounded-full w-12 h-12 transition-all",
                    viewMode === 'path' ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "hover:bg-slate-100 text-slate-500"
                )}
                onClick={() => setViewMode('path')}
                title="Chế độ Lộ trình học"
            >
                <ListTree className="w-6 h-6" />
            </Button>
         </div>
      </div>

      {/* =========================================================
          POPUP DETAILS (DÙNG CHUNG CHO CẢ 2 CHẾ ĐỘ)
         ========================================================= */}
      {selectedNode && (
        <NodeDetailDialog
          isOpen
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          // Truyền progress hiện tại vào Dialog
          currentProgress={progress[selectedNode.id]} 
        />
      )}
    </div>
  );
}
