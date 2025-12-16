// frontend_nextjs/src/app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';

function humanizeAuthError(message?: string) {
  if (!message) return 'Không thể xác thực. Vui lòng thử lại.';
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) return 'Sai email hoặc mật khẩu.';
  if (m.includes('user already registered')) return 'Email này đã được đăng ký.';
  if (m.includes('password should be at least')) return 'Mật khẩu quá ngắn.';
  if (m.includes('email') && m.includes('invalid')) return 'Email không hợp lệ.';
  return message;
}

export default function LoginPage() {
  const { user, isUserLoading, error: userError } = useUser();
  const { client: supabase, error: supabaseError } = useSupabase();
  const router = useRouter();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !isUserLoading) {
      setIsRedirecting(true);
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleEmailPasswordAuth = async (e: FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Hệ thống chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const email = formData.email.trim();
      const password = formData.password;

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        router.push('/');
        return;
      }

      // === SIGN UP (KHÔNG CẦN VERIFY EMAIL) ===
      if (password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        setIsLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // Nếu Supabase trả session ngay (khi đã tắt Confirm email) => vào thẳng
      if (data.session) {
        router.push('/');
        return;
      }

      // Fallback: một số cấu hình/edge-case có thể không trả session ngay
      // => auto-login luôn để đúng yêu cầu "đăng ký xong đăng nhập được"
      const { error: autoSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (autoSignInError) {
        // Nếu vẫn lỗi thì chuyển về mode đăng nhập
        setIsLogin(true);
        setError('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
        return;
      }

      router.push('/');
    } catch (err: any) {
      console.error('❌ Authentication error:', err);
      setError(humanizeAuthError(err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    router.push('/tests');
  };

  const blockingError = userError || supabaseError;

  if (blockingError) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 p-4 text-center">
          <div className="text-red-500 text-lg">❌ Lỗi hệ thống</div>
          <p className="text-sm text-muted-foreground">{blockingError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Thử lại
          </Button>
        </div>
      </main>
    );
  }

  if (isUserLoading || isRedirecting) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin" />
          <p>Đang tải...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isLogin ? 'Đăng nhập' : 'Đăng ký'}</CardTitle>
          <CardDescription>
            {isLogin
              ? 'Đăng nhập để lưu kết quả và theo dõi tiến độ học tập'
              : 'Tạo tài khoản để lưu kết quả và theo dõi tiến độ học tập'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={isLoading}
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập ngay'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          <Button onClick={handleGuestLogin} className="w-full" variant="outline" disabled={isLoading}>
            Tiếp tục với tư cách khách
          </Button>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật
          </p>
        </CardContent>
      </Card>
    </main>
  );
}