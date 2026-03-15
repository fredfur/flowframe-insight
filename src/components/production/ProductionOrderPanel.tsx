import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ClipboardList, Plus, Play, Square, Pencil, Trash2, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockFlows } from '@/data/mockData';
import { FlowService } from '@/services/api';
import type { ProductionFlow } from '@/types/production';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ─── Types ───

export type OrderStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ProductionOrder {
  id: string;
  code: string;
  productName: string;
  sku: string;
  targetQty: number;
  producedQty: number;
  lineId: string;
  status: OrderStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ─── Helpers ───

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Play }> = {
  planned: { label: 'Planejada', color: 'bg-muted text-muted-foreground border-border', icon: Clock },
  in_progress: { label: 'Em Produção', color: 'bg-status-running/10 text-status-running border-status-running/20', icon: Play },
  completed: { label: 'Concluída', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-status-fault/10 text-status-fault border-status-fault/20', icon: AlertCircle },
};

let nextId = 3;

// ─── Component ───

interface Props {
  lineId: string;
}

export function ProductionOrderPanel({ lineId }: Props) {
  const [orders, setOrders] = useState<ProductionOrder[]>([
    {
      id: 'op-1', code: 'OP-2026-001', productName: 'Água Mineral 500ml', sku: 'SKU-101',
      targetQty: 10000, producedQty: 6200, lineId: 'line-1', status: 'in_progress',
      createdAt: '2026-03-08T06:00:00', startedAt: '2026-03-08T06:15:00',
    },
    {
      id: 'op-2', code: 'OP-2026-002', productName: 'Suco Natural 1L', sku: 'SKU-204',
      targetQty: 5000, producedQty: 0, lineId: 'line-1', status: 'planned',
      createdAt: '2026-03-08T05:00:00',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [lineFlows, setLineFlows] = useState<ProductionFlow[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);

  const loadFlowsForLine = useCallback(async () => {
    if (!lineId) return;
    if (API_BASE) {
      setLoadingFlows(true);
      try {
        const flows = await FlowService.getByLine(lineId);
        setLineFlows(flows ?? []);
      } catch {
        setLineFlows([]);
      } finally {
        setLoadingFlows(false);
      }
    } else {
      setLineFlows(mockFlows.filter(f => f.lineId === lineId));
    }
  }, [lineId]);

  useEffect(() => {
    loadFlowsForLine();
  }, [loadFlowsForLine]);

  // Form state
  const [formProductId, setFormProductId] = useState('');
  const [formTargetQty, setFormTargetQty] = useState('');
  const [formCode, setFormCode] = useState('');

  const availableProducts = lineFlows;

  const activeOrder = orders.find(o => o.status === 'in_progress' && o.lineId === lineId);
  const lineOrders = orders.filter(o => o.lineId === lineId);

  function openNewDialog() {
    setEditingOrder(null);
    const num = String(nextId++).padStart(3, '0');
    setFormCode(`OP-2026-${num}`);
    setFormProductId('');
    setFormTargetQty('');
    setDialogOpen(true);
  }

  function openEditDialog(order: ProductionOrder) {
    setEditingOrder(order);
    setFormCode(order.code);
    const flow = lineFlows.find(f => f.sku === order.sku);
    setFormProductId(flow?.id ?? '');
    setFormTargetQty(String(order.targetQty));
    setDialogOpen(true);
  }

  function saveOrder() {
    const flow = lineFlows.find(f => f.id === formProductId);
    if (!flow || !formTargetQty || !formCode) return;

    if (editingOrder) {
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? {
        ...o,
        code: formCode,
        productName: flow.name,
        sku: flow.sku,
        targetQty: Number(formTargetQty),
      } : o));
    } else {
      const newOrder: ProductionOrder = {
        id: `op-${Date.now()}`,
        code: formCode,
        productName: flow.name,
        sku: flow.sku,
        targetQty: Number(formTargetQty),
        producedQty: 0,
        lineId,
        status: 'planned',
        createdAt: new Date().toISOString(),
      };
      setOrders(prev => [...prev, newOrder]);
    }
    setDialogOpen(false);
  }

  function startOrder(id: string) {
    setOrders(prev => prev.map(o => {
      if (o.id === id) return { ...o, status: 'in_progress' as const, startedAt: new Date().toISOString() };
      // Stop any other in-progress order on same line
      if (o.lineId === lineId && o.status === 'in_progress') return { ...o, status: 'planned' as const };
      return o;
    }));
  }

  function stopOrder(id: string) {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'completed' as const, completedAt: new Date().toISOString() } : o
    ));
  }

  function deleteOrder(id: string) {
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Ordens de Produção</p>
          {activeOrder && (
            <Badge variant="outline" className="bg-status-running/10 text-status-running border-status-running/20 text-[10px]">
              {activeOrder.code} em produção
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={openNewDialog} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          Nova Ordem
        </Button>
      </div>

      {/* Active order highlight */}
      {activeOrder && (
        <div className="mx-4 mt-3 rounded-lg border border-status-running/20 bg-status-running/5 p-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-status-running/10 flex items-center justify-center shrink-0">
                <Play className="h-4 w-4 text-status-running" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{activeOrder.code} — {activeOrder.productName}</p>
                <p className="text-[10px] text-muted-foreground">{activeOrder.sku} · Meta: {activeOrder.targetQty.toLocaleString()} un</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-foreground">{activeOrder.producedQty.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">
                  {((activeOrder.producedQty / activeOrder.targetQty) * 100).toFixed(1)}% concluído
                </p>
              </div>
              <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-status-running transition-all"
                  style={{ width: `${Math.min(100, (activeOrder.producedQty / activeOrder.targetQty) * 100)}%` }}
                />
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-status-fault/30 text-status-fault hover:bg-status-fault/10" onClick={() => stopOrder(activeOrder.id)}>
                <Square className="h-3 w-3" />
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="p-4">
        {lineOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nenhuma ordem de produção criada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Código</TableHead>
                <TableHead className="text-xs">Produto / SKU</TableHead>
                <TableHead className="text-xs text-right">Meta</TableHead>
                <TableHead className="text-xs text-right">Produzido</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineOrders.map(order => {
                const cfg = statusConfig[order.status];
                const Icon = cfg.icon;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs font-medium">{order.code}</TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">{order.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.sku}</p>
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{order.targetQty.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{order.producedQty.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] gap-1', cfg.color)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {order.status === 'planned' && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Iniciar" onClick={() => startOrder(order.id)}>
                            <Play className="h-3 w-3 text-status-running" />
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Finalizar" onClick={() => stopOrder(order.id)}>
                            <Square className="h-3 w-3 text-status-fault" />
                          </Button>
                        )}
                        {(order.status === 'planned' || order.status === 'completed') && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditDialog(order)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {order.status !== 'in_progress' && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteOrder(order.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingOrder ? 'Editar Ordem de Produção' : 'Nova Ordem de Produção'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Código da Ordem</Label>
              <Input
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                placeholder="OP-2026-001"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Produto</Label>
              {loadingFlows ? (
                <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/30">
                  A carregar produtos da linha…
                </p>
              ) : availableProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/30">
                  Nenhum produto vinculado a esta linha nas configurações. Adicione fluxos (produtos) à linha em Configurações.
                </p>
              ) : (
                <Select value={formProductId} onValueChange={setFormProductId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <span>{f.name}</span>
                          <span className="text-muted-foreground text-xs">({f.sku})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formProductId && (
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  {(() => {
                    const f = lineFlows.find(x => x.id === formProductId);
                    return f ? (
                      <span>Vel. Nominal: <strong className="text-foreground">{f.nominalSpeed} u/h</strong></span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantidade Meta</Label>
              <Input
                type="number"
                value={formTargetQty}
                onChange={e => setFormTargetQty(e.target.value)}
                placeholder="10000"
                className="h-9 text-sm"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={saveOrder} disabled={!formProductId || !formTargetQty || !formCode}>
              {editingOrder ? 'Salvar' : 'Criar Ordem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
