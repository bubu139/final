'use client';

import { Button } from '@/components/ui/button';
import { Loader, RefreshCw, Send } from 'lucide-react';

interface Props {
  onSubmit: () => void;
  onRetry: () => void;
  isSubmitted: boolean;
  canSubmit: boolean;
}

export function TestControls({ onSubmit, onRetry, isSubmitted, canSubmit }: Props) {
  return (
    <div className="mt-8 flex justify-end gap-4">
      {isSubmitted ? (
        <Button onClick={onRetry} variant="outline" size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm lại bài khác
        </Button>
      ) : (
        <Button onClick={onSubmit} size="lg" disabled={!canSubmit}>
          <Send className="mr-2 h-4 w-4" />
          Nộp bài
        </Button>
      )}
    </div>
  );
}
