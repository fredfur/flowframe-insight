import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { mockSites, mockLines, mockEquipments, mockFlows } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import type { Site, ProductionLine, Equipment, ProductionFlow, Transport } from '@/types/production';
import {
  Settings, Building2, Factory, Cog, GitBranch, Gauge, Tag,
  Plus, Pencil, Trash2, ChevronRight, ChevronDown, MapPin, ArrowRightLeft,
} from 'lucide-react';

type DialogMode = 'create' | 'edit';

export default function Configuracoes() {
  // Local state mirrors (would be replaced by DB later)
  const [sites, setSites] = useState<Site[]>(mockSites);
  const [lines, setLines] = useState<ProductionLine[]>(mockLines);
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments);
  const [flows, setFlows] = useState<ProductionFlow[]>(mockFlows);

  // Expansion state
  const [expandedSite, setExpandedSite] = useState<string | null>('site-1');
  const [expandedLine, setExpandedLine] = useState<string | null>('line-1');
  const [activeTab, setActiveTab] = useState<'equipments' | 'flows' | 'transports'>('equipments');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'site' | 'line' | 'equipment' | 'flow' | 'transport'>('site');
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogContext, setDialogContext] = useState<string>(''); // parent ID

  // Form fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const resetForm = () => {
    setFormName('');
    setFormType('');
    setFormLocation('');
    setFormNominal('');
    setFormSku('');
    setFormCapacity('');
  };

  const openCreateDialog = (type: typeof dialogType, contextId = '') => {
    setDialogType(type);
    setDialogMode('create');
    setDialogContext(contextId);
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (type: typeof dialogType, id: string) => {
    setDialogType(type);
    setDialogMode('edit');
    setEditingId(id);

    if (type === 'site') {
      const s = sites.find(s => s.id === id);
      if (s) { setFormName(s.name); setFormLocation(s.location); }
    } else if (type === 'line') {
      const l = lines.find(l => l.id === id);
      if (l) { setFormName(l.name); setFormType(l.type); setFormNominal(String(l.nominalSpeed)); setDialogContext(l.siteId); }
    } else if (type === 'equipment') {
      const e = equipments.find(e => e.id === id);
      if (e) { setFormName(e.name); setFormType(e.type); setFormNominal(String(e.nominalSpeed)); setDialogContext(e.lineId); }
    } else if (type === 'flow') {
      const f = flows.find(f => f.id === id);
      if (f) { setFormName(f.name); setFormSku(f.sku); setFormNominal(String(f.nominalSpeed)); setDialogContext(f.lineId); }
    } else if (type === 'transport') {
      const line = lines.find(l => l.transports.some(t => t.id === id));
      const t = line?.transports.find(t => t.id === id);
      if (t && line) { setFormCapacity(String(t.capacity)); setFormType(t.type); setDialogContext(line.id); }
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const id = editingId || `${dialogType}-${Date.now()}`;

    if (dialogType === 'site') {
      if (dialogMode === 'create') {
        setSites(prev => [...prev, { id, name: formName, location: formLocation, lines: [] }]);
      } else {
        setSites(prev => prev.map(s => s.id === id ? { ...s, name: formName, location: formLocation } : s));
      }
    } else if (dialogType === 'line') {
      if (dialogMode === 'create') {
        const newLine: ProductionLine = {
          id, name: formName, type: formType, siteId: dialogContext,
          nominalSpeed: Number(formNominal) || 0, machines: [], transports: [],
          oee: { availability: 0, performance: 0, quality: 0, oee: 0 }, throughput: 0,
        };
        setLines(prev => [...prev, newLine]);
        setSites(prev => prev.map(s => s.id === dialogContext ? { ...s, lines: [...s.lines, id] } : s));
      } else {
        setLines(prev => prev.map(l => l.id === id ? { ...l, name: formName, type: formType, nominalSpeed: Number(formNominal) || 0 } : l));
      }
    } else if (dialogType === 'equipment') {
      if (dialogMode === 'create') {
        const lineEquips = equipments.filter(e => e.lineId === dialogContext);
        const newPosition = lineEquips.length + 1;
        const newEquip: Equipment = {
          id, name: formName, type: formType, lineId: dialogContext,
          position: newPosition, nominalSpeed: Number(formNominal) || 0,
        };
        setEquipments(prev => [...prev, newEquip]);
        // Auto-create transport from previous equipment to this one
        if (newPosition > 1) {
          const transportId = `transport-${Date.now()}`;
          const newTransport: Transport = {
            id: transportId, fromPosition: newPosition - 1, toPosition: newPosition,
            lineId: dialogContext, type: 'conveyor', accumulation: 'normal',
            accumulationPercent: 0, capacity: 50, currentUnits: 0,
          };
          setLines(prev => prev.map(l => l.id === dialogContext
            ? { ...l, transports: [...l.transports, newTransport] }
            : l
          ));
        }
      } else {
        setEquipments(prev => prev.map(e => e.id === id ? { ...e, name: formName, type: formType, nominalSpeed: Number(formNominal) || 0 } : e));
      }
    } else if (dialogType === 'flow') {
      if (dialogMode === 'create') {
        const lineEquipIds = equipments.filter(e => e.lineId === dialogContext).map(e => e.id);
        const newFlow: ProductionFlow = {
          id, name: formName, sku: formSku, lineId: dialogContext,
          equipmentIds: lineEquipIds, nominalSpeed: Number(formNominal) || 0,
        };
        setFlows(prev => [...prev, newFlow]);
      } else {
        setFlows(prev => prev.map(f => f.id === id ? { ...f, name: formName, sku: formSku, nominalSpeed: Number(formNominal) || 0 } : f));
      }
    } else if (dialogType === 'transport') {
      // Only edit mode for transports
      setLines(prev => prev.map(l => l.id === dialogContext
        ? {
          ...l,
          transports: l.transports.map(t => t.id === id
            ? { ...t, capacity: Number(formCapacity) || t.capacity, type: (formType as Transport['type']) || t.type }
            : t
          ),
        }
        : l
      ));
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (type: typeof dialogType, id: string) => {
    if (type === 'site') {
      setSites(prev => prev.filter(s => s.id !== id));
      setLines(prev => prev.filter(l => l.siteId !== id));
    } else if (type === 'line') {
      setLines(prev => prev.filter(l => l.id !== id));
      setEquipments(prev => prev.filter(e => e.lineId !== id));
      setFlows(prev => prev.filter(f => f.lineId !== id));
    } else if (type === 'equipment') {
      setEquipments(prev => prev.filter(e => e.id !== id));
    } else if (type === 'flow') {
      setFlows(prev => prev.filter(f => f.id !== id));
    }
  };

  const dialogTitles: Record<string, Record<string, string>> = {
    site: { create: 'Novo Site', edit: 'Editar Site' },
    line: { create: 'Nova Linha', edit: 'Editar Linha' },
    equipment: { create: 'Novo Equipamento', edit: 'Editar Equipamento' },
    flow: { create: 'Novo Fluxo', edit: 'Editar Fluxo' },
    transport: { create: 'Novo Transporte', edit: 'Editar Transporte' },
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Settings style={{ width: '1.3rem', height: '1.3rem' }} /> Configurações
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Gerencie sites, linhas, equipamentos, fluxos e categorias de parada.
          </p>
        </div>
        <Button size="sm" onClick={() => openCreateDialog('site')} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Site
        </Button>
      </div>

      {/* Sites hierarchy */}
      <div className="space-y-3">
        {sites.map(site => {
          const siteLines = lines.filter(l => l.siteId === site.id);
          const isExpanded = expandedSite === site.id;

          return (
            <div key={site.id} className="rounded-lg border bg-card overflow-hidden">
              {/* Site header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedSite(isExpanded ? null : site.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Building2 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{site.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {site.location} · {siteLines.length} linhas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('site', site.id)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete('site', site.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openCreateDialog('line', site.id)}>
                    <Plus className="h-3 w-3" /> Linha
                  </Button>
                </div>
              </div>

              {/* Lines inside site */}
              {isExpanded && (
                <div className="border-t">
                  {siteLines.length === 0 && (
                    <p className="px-8 py-4 text-[11px] text-muted-foreground italic">Nenhuma linha cadastrada.</p>
                  )}
                  {siteLines.map(line => {
                    const lineEquips = equipments.filter(e => e.lineId === line.id);
                    const lineFlows = flows.filter(f => f.lineId === line.id);
                    const isLineExpanded = expandedLine === line.id;

                    return (
                      <div key={line.id} className="border-b last:border-b-0">
                        {/* Line header */}
                        <div
                          className="flex items-center justify-between px-4 pl-8 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                          onClick={() => setExpandedLine(isLineExpanded ? null : line.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isLineExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-[12px] font-medium text-foreground">{line.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {line.type} · {lineEquips.length} equipamentos · {lineFlows.length} fluxos · {line.nominalSpeed} u/h
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('line', line.id)}>
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete('line', line.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Line content: equipments + flows */}
                        {isLineExpanded && (
                          <div className="bg-muted/10 border-t">
                            {/* Tab switcher */}
                            <div className="flex items-center gap-0 px-8 pt-2">
                              <button
                                onClick={() => setActiveTab('equipments')}
                                className={`px-3 py-1.5 text-[11px] font-medium rounded-t-md transition-colors ${activeTab === 'equipments' ? 'bg-card text-foreground border border-b-0' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                <Cog className="h-3 w-3 inline mr-1" /> Equipamentos ({lineEquips.length})
                              </button>
                              <button
                                onClick={() => setActiveTab('flows')}
                                className={`px-3 py-1.5 text-[11px] font-medium rounded-t-md transition-colors ${activeTab === 'flows' ? 'bg-card text-foreground border border-b-0' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                <GitBranch className="h-3 w-3 inline mr-1" /> Fluxos ({lineFlows.length})
                              </button>
                            </div>

                            <div className="bg-card mx-8 mb-3 rounded-b-md rounded-tr-md border p-3">
                              {activeTab === 'equipments' && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-end mb-2">
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openCreateDialog('equipment', line.id)}>
                                      <Plus className="h-3 w-3" /> Equipamento
                                    </Button>
                                  </div>
                                  {lineEquips.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground italic text-center py-2">Nenhum equipamento.</p>
                                  )}
                                  {lineEquips.sort((a, b) => a.position - b.position).map(eq => (
                                    <div key={eq.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                      <div className="flex items-center gap-2.5">
                                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-mono text-primary">{eq.position}</span>
                                        <div>
                                          <p className="text-[11px] font-medium text-foreground">{eq.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{eq.type}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                          <Gauge className="h-3 w-3" /> {eq.nominalSpeed} u/h
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('equipment', eq.id)}>
                                          <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('equipment', eq.id)}>
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {activeTab === 'flows' && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-end mb-2">
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openCreateDialog('flow', line.id)}>
                                      <Plus className="h-3 w-3" /> Fluxo
                                    </Button>
                                  </div>
                                  {lineFlows.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground italic text-center py-2">Nenhum fluxo.</p>
                                  )}
                                  {lineFlows.map(flow => {
                                    const flowEquips = equipments.filter(e => flow.equipmentIds.includes(e.id));
                                    return (
                                      <div key={flow.id} className="px-3 py-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-[11px] font-medium text-foreground">{flow.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                              SKU: <span className="font-mono font-medium text-foreground">{flow.sku}</span> · Nominal: {flow.nominalSpeed} u/h
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('flow', flow.id)}>
                                              <Pencil className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete('flow', flow.id)}>
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                        </div>
                                        {flowEquips.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {flowEquips.map((eq, i) => (
                                              <span key={eq.id} className="inline-flex items-center">
                                                <Badge variant="outline" className="text-[9px]">{eq.name}</Badge>
                                                {i < flowEquips.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stop categories (read-only) */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <p className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Categorias de Parada
          </p>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {STOP_CATEGORIES.map((cat) => (
            <Badge key={cat.id} variant="outline" style={{ borderColor: cat.color, color: cat.color }} className="text-[10px]">
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Dados armazenados localmente. Ative o backend para persistência.
      </p>

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {dialogTitles[dialogType]?.[dialogMode] || 'Configuração'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Nome</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome" className="h-8 text-sm mt-1" />
            </div>

            {dialogType === 'site' && (
              <div>
                <Label className="text-[11px]">Localização</Label>
                <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Cidade, Estado" className="h-8 text-sm mt-1" />
              </div>
            )}

            {(dialogType === 'line' || dialogType === 'equipment') && (
              <div>
                <Label className="text-[11px]">Tipo</Label>
                <Input value={formType} onChange={e => setFormType(e.target.value)} placeholder="Ex: Envase, Processor" className="h-8 text-sm mt-1" />
              </div>
            )}

            {(dialogType === 'line' || dialogType === 'equipment' || dialogType === 'flow') && (
              <div>
                <Label className="text-[11px]">Velocidade Nominal (u/h)</Label>
                <Input type="number" value={formNominal} onChange={e => setFormNominal(e.target.value)} placeholder="500" className="h-8 text-sm mt-1" />
              </div>
            )}

            {dialogType === 'flow' && (
              <div>
                <Label className="text-[11px]">SKU / Código do Produto</Label>
                <Input value={formSku} onChange={e => setFormSku(e.target.value)} placeholder="Ex: SKU-204" className="h-8 text-sm mt-1 font-mono" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim()} className="text-xs">
              {dialogMode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
