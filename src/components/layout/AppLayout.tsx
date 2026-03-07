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
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border" />
              <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                <SelectTrigger className="w-[220px] h-8 text-xs bg-background border-border">
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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>LIVE</span>
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
