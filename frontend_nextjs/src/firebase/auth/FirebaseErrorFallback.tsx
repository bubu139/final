'use client';

import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  error?: string;
  onRetry?: () => void;
}

export function FirebaseErrorFallback({ error, onRetry }: Props) {
  return (
    <Card className="border-red-200 bg-red-50 max-w-md w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertTriangle className="w-5 h-5" />
          Lỗi kết nối
        </CardTitle>
        <CardDescription className="text-red-800">
          Không thể kết nối đến hệ thống xác thực.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-red-700">
          <p className="font-semibold">Chi tiết lỗi:</p>
          <p className="mt-1 font-mono text-xs bg-red-100 p-2 rounded">
            {error || 'Firebase configuration error'}
          </p>
        </div>
        
        <div className="text-sm text-red-700">
          <p className="font-semibold">Cách khắc phục:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Kiểm tra file .env.local</li>
            <li>Xác minh cấu hình Firebase</li>
            <li>Đảm bảo kết nối internet</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="text-red-700 border-red-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          )}
          <Button variant="outline" className="text-blue-700 border-blue-300">
            <Settings className="w-4 h-4 mr-2" />
            Trợ giúp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}