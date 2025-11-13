// frontend_nextjs/src/components/app-shell.tsx
'use client';

import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  BrainCircuit,
  MessageSquare,
  FileText,
  Home,
  History,
  LogOut,
  LogIn,
  User as UserIcon,
  UserRound,
  FolderKanban
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/supabase/auth/use-user';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

const menuItems = [
  {
    title: 'Trang chủ',
    icon: Home,
    href: '/',
  },
  {
    title: 'Sơ đồ tư duy',
    icon: BrainCircuit,
    href: '/mindmap',
  },
  {
    title: 'Trợ lý AI',
    icon: MessageSquare,
    href: '/chat',
  },
  {
    title: 'Luyện đề',
    icon: FileText,
    href: '/tests',
  },
  {
    title: 'Kho tài liệu',
    icon: FolderKanban,
    href: '/library',
  },
  {
    title: 'Trang cá nhân',
    icon: UserRound,
    href: '/user',
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading, logout } = useUser();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <span className="font-headline font-bold text-lg">MathMentor</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user && (
              <SidebarGroup>
                <SidebarGroupLabel>Học tập</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/test-history'}>
                        <Link href="/test-history">
                          <History />
                          <span>Lịch sử làm bài</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            {isUserLoading ? (
              <div className="h-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.email || 'Người dùng'}
                    </p>
                    <p className="text-xs text-muted-foreground">Đã đăng nhập</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => { void handleSignOut(); }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </Link>
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
            </div>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}