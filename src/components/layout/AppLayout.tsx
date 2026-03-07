import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Moon, Sun, UserCircle } from 'lucide-react';
import { mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { useTheme } from 'next-themes';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppLayout() {
  const { selectedLineId, setSelectedLineId } = useLineStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [pageKey, setPageKey] = useState(location.pathname);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b px-4 bg-background shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors" />
              <div className="h-4 w-px bg-border" />
              <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                <SelectTrigger className="w-[200px] h-8 text-sm">
                  <SelectValue placeholder="Selecionar linha" />
                </SelectTrigger>
                <SelectContent>
                  {mockLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionIndicator />
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-status-running animate-pulse" />
                <span>Live</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="h-4 w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/login')}
                    className="text-destructive focus:text-destructive"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div
              key={pageKey}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
