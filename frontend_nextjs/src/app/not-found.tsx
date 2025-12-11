// frontend_nextjs/src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">404 - Không tìm thấy trang</CardTitle>
          <CardDescription>
            Trang bạn đang tìm kiếm không tồn tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}