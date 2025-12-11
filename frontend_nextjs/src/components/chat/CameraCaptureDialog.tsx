'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Check,
  SwitchCamera,
  Loader2,
  CameraOff,
} from 'lucide-react';

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mặc định camera trước
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const stopCamera = useCallback(() => {
    setStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => track.stop());
      }
      return null;
    });
  }, []);

  const startCamera = useCallback(async () => {
    // nếu đã có stream rồi thì không khởi động lại
    if (stream) return;

    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(mediaStream);

      const video = videoRef.current;
      if (video) {
        video.srcObject = mediaStream;
        await video.play().catch(() => {
          // ignore play errors (autoplay policies...)
        });
      }
    } catch (err: any) {
      console.error('Lỗi Camera:', err);
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError'
      ) {
        setError('Vui lòng cho phép quyền truy cập camera trong trình duyệt.');
      } else if (err?.name === 'NotFoundError') {
        setError('Không tìm thấy thiết bị camera.');
      } else {
        setError(
          'Không thể bật camera. Hãy kiểm tra thiết bị và thử tải lại trang.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  // Gán stream vào video mỗi khi stream thay đổi
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = stream;
    video
      .play()
      .catch(() => {
        /* ignore */
      });

    return () => {
      video.pause();
    };
  }, [stream]);

  // Khi dialog mở/đóng
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
  }, [open, capturedImage, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || video.clientWidth || 720;
    const height = video.videoHeight || video.clientHeight || 1280;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lật gương nếu dùng camera trước
    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    if (facingMode === 'user') {
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const file = new File([blob], `cam-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    onCapture(file);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onOpenChange(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    // facingMode đổi ⇒ effect phía trên sẽ gọi startCamera lại
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-slate-800 text-white gap-0">
        {/* Bắt buộc phải có DialogTitle cho Radix, ẩn bằng sr-only */}
        <DialogHeader className="sr-only">
          <DialogTitle>Chụp ảnh bài tập</DialogTitle>
          <DialogDescription>
            Sử dụng camera để chụp lại đề bài cần giải.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[3/4] bg-slate-900 flex items-center justify-center overflow-hidden">
          {/* VIDEO */}
          {!capturedImage && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          )}

          {/* ẢNH ĐÃ CHỤP */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Ảnh chụp"
              className="w-full h-full object-cover"
            />
          )}

          {/* LOADING */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <p className="text-sm text-slate-100">Đang bật camera…</p>
            </div>
          )}

          {/* LỖI CAMERA */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-4 text-center">
              <CameraOff className="w-10 h-10 text-slate-300" />
              <p className="text-sm text-slate-100">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="bg-white/10 border-slate-500 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </Button>
            </div>
          )}

          {/* NÚT ĐỔI CAMERA (khi không lỗi & chưa chụp) */}
          {!capturedImage && !error && (
            <button
              type="button"
              onClick={toggleCamera}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white border border-white/30 hover:bg-black/60 transition"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* THANH BUTTON DƯỚI */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          {!capturedImage ? (
            <>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={handleClose}
              >
                Hủy
              </Button>

              <button
                type="button"
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50"
                onClick={handleCapture}
                disabled={!!error || isLoading}
              />

              <div className="w-16" />
            </>
          ) : (
            <div className="flex w-full gap-4">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 bg-transparent text-white border-slate-500 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Chụp lại
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                <Check className="w-4 h-4 mr-2" />
                Sử dụng
              </Button>
            </div>
          )}
        </div>

        {/* Canvas ẩn để xử lý ảnh */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
