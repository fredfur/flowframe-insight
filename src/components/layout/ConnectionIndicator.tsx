import { useState } from 'react';
import { Wifi, WifiOff, Camera, CameraOff, Router } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ConnectionStatus {
  gateway: { connected: boolean; latency?: number; lastSeen?: string };
  camera: { connected: boolean; fps?: number; lastFrame?: string };
}

// Mock connection status — will be replaced by real polling/websocket
const useMockConnectionStatus = (): ConnectionStatus => {
  return {
    gateway: { connected: true, latency: 23, lastSeen: 'agora' },
    camera: { connected: false, fps: 0, lastFrame: '2 min atrás' },
  };
};

export function ConnectionIndicator() {
  const status = useMockConnectionStatus();
  const allConnected = status.gateway.connected && status.camera.connected;
  const someConnected = status.gateway.connected || status.camera.connected;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
          <Router className={cn(
            'h-4 w-4',
            allConnected ? 'text-status-running' : someConnected ? 'text-status-setup' : 'text-status-stopped'
          )} />
          <span className={cn(
            'absolute top-1 right-1 h-2 w-2 rounded-full border-2 border-background',
            allConnected ? 'bg-status-running' : someConnected ? 'bg-status-setup' : 'bg-status-stopped'
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-medium text-foreground">Conectividade</p>
        </div>
        <div className="p-2 space-y-1">
          <ConnectionRow
            icon={status.gateway.connected ? Wifi : WifiOff}
            label="Gateway ESP32"
            connected={status.gateway.connected}
            detail={status.gateway.connected ? `${status.gateway.latency}ms · ${status.gateway.lastSeen}` : 'Desconectado'}
          />
          <ConnectionRow
            icon={status.camera.connected ? Camera : CameraOff}
            label="Câmera"
            connected={status.camera.connected}
            detail={status.camera.connected ? `${status.camera.fps} FPS · ${status.camera.lastFrame}` : `Última: ${status.camera.lastFrame}`}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ConnectionRow({ icon: Icon, label, connected, detail }: {
  icon: typeof Wifi;
  label: string;
  connected: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
      <Icon className={cn('h-4 w-4 shrink-0', connected ? 'text-status-running' : 'text-status-stopped')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
      </div>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full shrink-0',
        connected ? 'bg-status-running' : 'bg-status-stopped'
      )} />
    </div>
  );
}
