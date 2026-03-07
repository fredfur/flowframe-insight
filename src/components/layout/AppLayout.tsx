import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { useThemeStore } from '@/stores/themeStore';

export function AppLayout() {
  const { selectedLineId, setSelectedLineId } = useLineStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${theme}`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 flex items-center justify-between border-b px-3 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border" />
              <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                <SelectTrigger className="w-[200px] h-7 text-xs border-none bg-transparent shadow-none hover:bg-accent">
                  <SelectValue placeholder="Selecionar linha" />
                </SelectTrigger>
                <SelectContent>
                  {mockLines.map((line) => (
                    <SelectItem key={line.id} value={line.id} className="text-xs">
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                <span className="h-1.5 w-1.5 rounded-full bg-status-running animate-pulse" />
                <span className="text-[11px]">Live</span>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
