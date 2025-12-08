"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Gauge,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  AlertCircle,
  Video as VideoIcon,
} from "lucide-react";

type VideoSegment = {
  id: string;
  segment_index: number;
  start_second: number;
  end_second: number;
  status: "pending" | "processing" | "done" | "failed";
  video_url?: string;
  error_message?: string;
};

type NodeVideo = {
  id: string;
  node_id: string;
  prompt: string;
  status: string;
  segments: VideoSegment[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LectureVideoPage() {
  const params = useParams<{ nodeId: string }>();
  const searchParams = useSearchParams();
  const topicTitle = searchParams.get("title") ?? "Bài giảng";

  const [video, setVideo] = useState<NodeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState({
    isPlaying: false,
    volume: 0.8,
    rate: 1,
    progress: 0,
    duration: 30,
  });

  // Tạo video mới
  const createVideo = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/videos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: params.nodeId,
          prompt: `Tạo video bài giảng về ${topicTitle}`,
          audio_url: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể tạo video");
      }

      const data: NodeVideo = await response.json();
      setVideo(data);
      setLoading(false);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tạo video");
      setCreating(false);
      setLoading(false);
    }
  };

  // Polling để cập nhật trạng thái video
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // Sử dụng endpoint /node/{node_id} thay vì /videos/{video_id}
        const response = await fetch(`${API_BASE_URL}/videos/node/${params.nodeId}`);
        
        if (response.status === 404) {
          // Video chưa tồn tại
          setLoading(false);
          setError("not_found");
          return;
        }
        
        if (!response.ok) {
          throw new Error("Không thể tải video");
        }
        
        const data: NodeVideo = await response.json();
        setVideo(data);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
        setLoading(false);
      }
    };

    fetchVideo();

    // Poll mỗi 2 giây để cập nhật trạng thái segments (chỉ khi đã có video)
    const interval = setInterval(() => {
      if (video) {
        fetchVideo();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [params.nodeId, video]);

  const segments = video?.segments || [];
  const currentSegment = useMemo(() => segments[currentSegmentIndex], [segments, currentSegmentIndex]);
  const nextSegment = segments[currentSegmentIndex + 1];

  // Gửi progress report về backend
  const reportProgress = async (currentSecond: number) => {
    if (!video?.id) return;
    try {
      await fetch(`${API_BASE_URL}/videos/${video.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_second: currentSecond }),
      });
    } catch (err) {
      console.error("Failed to report progress:", err);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSegment?.video_url) return;

    video.src = currentSegment.video_url;
    video.currentTime = 0;
    video.playbackRate = playback.rate;
    video.volume = playback.volume;
    setPlayback((state) => ({ ...state, progress: 0 }));

    if (playback.isPlaying) {
      void video.play();
    }
  }, [currentSegment?.video_url, currentSegmentIndex]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = playback.volume;
  }, [playback.volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playback.rate;
  }, [playback.rate]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !currentSegment) return;

    const duration = video.duration || currentSegment.end_second - currentSegment.start_second;
    const localProgress = video.currentTime;
    setPlayback((state) => ({ ...state, progress: localProgress, duration }));

    // Tính global second để report về backend
    const globalSecond = currentSegment.start_second + Math.floor(localProgress);

    // Report progress khi xem được 20s trong segment
    if (localProgress >= 20 && nextSegment && nextSegment.status === "pending") {
      reportProgress(globalSecond);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playback.isPlaying) {
      video.pause();
      setPlayback((state) => ({ ...state, isPlaying: false }));
    } else {
      void video.play();
      setPlayback((state) => ({ ...state, isPlaying: true }));
    }
  };

  const seek = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const duration = video.duration || (currentSegment?.end_second - currentSegment?.start_second);
    const nextTime = Math.min(Math.max(0, video.currentTime + delta), duration);
    video.currentTime = nextTime;
    setPlayback((state) => ({ ...state, progress: nextTime, duration }));
  };

  const handleSegmentEnd = () => {
    const video = videoRef.current;
    const readyNext = segments[currentSegmentIndex + 1];

    if (readyNext?.status === "done" && readyNext.video_url) {
      setCurrentSegmentIndex((index) => index + 1);
      setPlayback((state) => ({ ...state, progress: 0 }));
      return;
    }

    if (video) {
      video.pause();
      video.currentTime = video.duration;
      setPlayback((state) => ({ ...state, isPlaying: false }));
    }
  };

  const changeVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const normalized = Math.min(Math.max(value, 0), 1);
    video.volume = normalized;
    setPlayback((state) => ({ ...state, volume: normalized }));
  };

  const changeRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlayback((state) => ({ ...state, rate }));
  };

  const progressPercent = playback.duration
    ? Math.min(100, (playback.progress / playback.duration) * 100)
    : 0;

  // Trạng thái loading ban đầu
  if (loading && !video) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-6 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Đang kiểm tra video...</p>
      </div>
    );
  }

  // Video chưa được tạo - hiển thị nút tạo
  if (error === "not_found" && !video) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-6 py-20">
        <div className="rounded-full bg-muted p-6">
          <VideoIcon className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Video chưa được tạo</h2>
          <p className="mt-2 text-muted-foreground">
            Chưa có video cho bài giảng "{topicTitle}". Bấm nút bên dưới để bắt đầu tạo video.
          </p>
        </div>
        <Button
          size="lg"
          onClick={createVideo}
          disabled={creating}
          className="gap-2"
        >
          {creating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tạo video...
            </>
          ) : (
            <>
              <VideoIcon className="h-5 w-5" />
              Tạo video bài giảng
            </>
          )}
        </Button>
      </div>
    );
  }

  // Lỗi khác
  if (error && error !== "not_found") {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-6 py-20">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="text-destructive font-semibold">{error}</p>
          <Button
            variant="outline"
            onClick={createVideo}
            disabled={creating}
            className="mt-4"
          >
            Thử tạo lại
          </Button>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  const getSegmentBadgeVariant = (segment: VideoSegment) => {
    if (segment.status === "done") {
      return segment.segment_index === currentSegmentIndex ? "default" : "secondary";
    }
    return "outline";
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Node #{params.nodeId}</p>
          <h1 className="text-2xl font-bold">{topicTitle}</h1>
          <p className="text-muted-foreground">
            Video bài giảng được chia thành các đoạn 30 giây. Hệ thống sẽ tạo sẵn đoạn đầu, và tự động
            chuẩn bị đoạn tiếp theo khi bạn xem gần hết.
          </p>
        </div>
        <Badge variant={video.status === "done" ? "default" : "secondary"} className="self-start">
          {video.status === "done" ? "Hoàn tất" : "Đang xử lý"}
        </Badge>
      </div>

      <Card className="overflow-hidden border shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Trình phát bài giảng</CardTitle>
              <CardDescription>Điều khiển phát, tua nhanh/chậm, âm lượng và tốc độ.</CardDescription>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">30s/segment</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {!currentSegment || currentSegment.status !== "done" || !currentSegment.video_url ? (
            <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Đang tạo đoạn video {currentSegment?.segment_index}...
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  (Mock provider sẽ hoàn thành trong ~2 giây)
                </p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border bg-black/5">
              <video
                ref={videoRef}
                className="aspect-video h-full w-full bg-black"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleSegmentEnd}
                preload="metadata"
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                <Gauge className="h-4 w-4" />
                Đoạn {currentSegment.segment_index} ({currentSegment.start_second}s - {currentSegment.end_second}s)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{progressPercent.toFixed(0)}% đoạn hiện tại</span>
              <span>
                {currentSegment?.start_second + Math.round(playback.progress)}s / {currentSegment?.end_second}s tổng
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-4">
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={() => seek(-5)}
              disabled={!currentSegment?.video_url}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button 
              size="lg" 
              onClick={togglePlay} 
              className="min-w-[140px] justify-center gap-2"
              disabled={!currentSegment?.video_url}
            >
              {playback.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {playback.isPlaying ? "Dừng" : "Phát"}
            </Button>

            <Button 
              size="icon" 
              variant="secondary" 
              onClick={() => seek(5)}
              disabled={!currentSegment?.video_url}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {playback.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                Âm lượng
              </div>
              <Slider
                className="max-w-sm"
                value={[playback.volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(values) => changeVolume(values[0])}
              />
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Tốc độ:</span>
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <Button
                  key={rate}
                  size="sm"
                  variant={playback.rate === rate ? "default" : "outline"}
                  onClick={() => changeRate(rate)}
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tiến trình đoạn video</h3>
              <p className="text-xs text-muted-foreground">Tự động chuẩn bị đoạn tiếp theo khi xem được 20s</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {segments.map((segment) => (
                <Badge
                  key={segment.id}
                  variant={getSegmentBadgeVariant(segment)}
                  className="flex items-center gap-2"
                >
                  Đoạn {segment.segment_index}: {segment.start_second}s-{segment.end_second}s
                  {segment.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {segment.status === "pending" && <span className="text-[11px] text-muted-foreground">chờ</span>}
                  {segment.status === "failed" && <AlertCircle className="h-3 w-3 text-destructive" />}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Prompt:</span>
            <p className="text-muted-foreground">{video.prompt}</p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <span className="ml-2 text-muted-foreground">{video.status}</span>
          </div>
          <div>
            <span className="font-medium">Số đoạn:</span>
            <span className="ml-2 text-muted-foreground">{segments.length} đoạn</span>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            <p className="font-medium">💡 Lưu ý:</p>
            <p className="mt-1">
              Backend đang sử dụng MockVideoProvider. Video sẽ được "tạo" sau ~2 giây với URL demo.
              Để sử dụng video thật, hãy thay MockVideoProvider bằng GoogleVeoProvider trong video_service.py
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}