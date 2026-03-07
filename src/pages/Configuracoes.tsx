import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
import { mockSites, mockLines, mockEquipments, mockFlows } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import type { Site, ProductionLine, Equipment, ProductionFlow, Transport, StopCategory } from '@/types/production';
import {
  Settings, Building2, Factory, Cog, GitBranch, Gauge, Tag,
  Plus, Pencil, Trash2, ChevronRight, ChevronDown, MapPin, ArrowRightLeft,
  Users, Package, ShieldCheck, UserCircle, Crown, Clock, Link2,
} from 'lucide-react';

// ─── Types ───

type TopTab = 'structure' | 'users' | 'products' | 'stopCategories' | 'shifts' | 'assignments';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'leadership' | 'operator';
  status: 'active' | 'inactive';
  siteId?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  nominalSpeed: number;
  lineIds: string[];
}

interface StopCategoryRecord {
  id: string;
  code: StopCategory;
  label: string;
  color: string;
  isPlanned: boolean;
}

interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;
  days: string[]; // ['seg','ter',...]
  siteId?: string;
}

interface OperatorAssignment {
  id: string;
  operatorId: string;
  equipmentIds: string[];
  lineId: string;
  shiftIds: string[];
}

// ─── Mock data ───

const MOCK_USERS: UserRecord[] = [
  { id: 'u1', name: 'Carlos Silva', email: 'carlos@flowvision.com', role: 'admin', status: 'active' },
  { id: 'u2', name: 'Ana Souza', email: 'ana@flowvision.com', role: 'leadership', status: 'active', siteId: 'site-1' },
  { id: 'u3', name: 'João Oliveira', email: 'joao@flowvision.com', role: 'operator', status: 'active', siteId: 'site-1' },
  { id: 'u4', name: 'Maria Santos', email: 'maria@flowvision.com', role: 'operator', status: 'inactive', siteId: 'site-1' },
  { id: 'u5', name: 'Pedro Costa', email: 'pedro@flowvision.com', role: 'leadership', status: 'active', siteId: 'site-1' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Água Mineral 500ml', sku: 'SKU-101', category: 'Bebidas', nominalSpeed: 500, lineIds: ['line-1'] },
  { id: 'p2', name: 'Suco Natural 1L', sku: 'SKU-204', category: 'Bebidas', nominalSpeed: 350, lineIds: ['line-1'] },
  { id: 'p3', name: 'Refrigerante 350ml', sku: 'SKU-305', category: 'Bebidas', nominalSpeed: 600, lineIds: ['line-1', 'line-2'] },
  { id: 'p4', name: 'Detergente 500ml', sku: 'SKU-410', category: 'Limpeza', nominalSpeed: 450, lineIds: ['line-2'] },
  { id: 'p5', name: 'Sabonete Líquido 250ml', sku: 'SKU-520', category: 'Higiene', nominalSpeed: 400, lineIds: ['line-2'] },
];

const MOCK_STOP_CATS: StopCategoryRecord[] = STOP_CATEGORIES.map(c => ({
  id: c.id,
  code: c.id,
  label: c.label,
  color: c.color,
  isPlanned: c.id === 'planned' || c.id === 'setup',
}));

const MOCK_SHIFTS: Shift[] = [
  { id: 'sh1', name: 'Turno A — Manhã', startTime: '06:00', endTime: '14:00', days: ['seg', 'ter', 'qua', 'qui', 'sex'] },
  { id: 'sh2', name: 'Turno B — Tarde', startTime: '14:00', endTime: '22:00', days: ['seg', 'ter', 'qua', 'qui', 'sex'] },
  { id: 'sh3', name: 'Turno C — Noite', startTime: '22:00', endTime: '06:00', days: ['seg', 'ter', 'qua', 'qui', 'sex'] },
];

const MOCK_ASSIGNMENTS: OperatorAssignment[] = [
  { id: 'a1', operatorId: 'u3', equipmentIds: ['eq-1', 'eq-2'], lineId: 'line-1', shiftIds: ['sh1'] },
];

const roleLabels: Record<UserRecord['role'], string> = {
  admin: 'Administrador',
  leadership: 'Liderança',
  operator: 'Operação',
};

const roleBadgeStyles: Record<UserRecord['role'], string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  leadership: 'bg-status-scheduled/10 text-status-scheduled border-status-scheduled/20',
  operator: 'bg-muted text-muted-foreground border-border',
};

const ALL_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DAY_LABELS: Record<string, string> = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
};

// ─── Tab Buttons ───

const tabs: { id: TopTab; label: string; icon: typeof Settings }[] = [
  { id: 'structure', label: 'Estrutura', icon: Building2 },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'shifts', label: 'Turnos', icon: Clock },
  { id: 'assignments', label: 'Vínculos', icon: Link2 },
  { id: 'stopCategories', label: 'Cat. Parada', icon: Tag },
];

// ─── Main Component ───

export default function Configuracoes() {
  const [activeTopTab, setActiveTopTab] = useState<TopTab>('structure');

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Settings style={{ width: '1.3rem', height: '1.3rem' }} /> Configurações
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Gerencie estrutura, usuários, produtos, turnos, vínculos e categorias de parada.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTopTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              activeTopTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTopTab === 'structure' && <StructureTab />}
      {activeTopTab === 'users' && <UsersTab />}
      {activeTopTab === 'products' && <ProductsTab />}
      {activeTopTab === 'shifts' && <ShiftsTab />}
      {activeTopTab === 'assignments' && <AssignmentsTab />}
      {activeTopTab === 'stopCategories' && <StopCategoriesTab />}
    </div>
  );
}

// ─── Users Tab ───

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRecord['role']>('operator');

  const openCreate = () => {
    setEditingUser(null);
    setFormName(''); setFormEmail(''); setFormRole('operator');
    setDialogOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormName(user.name); setFormEmail(user.email); setFormRole(user.role);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id
        ? { ...u, name: formName, email: formEmail, role: formRole }
        : u
      ));
    } else {
      setUsers(prev => [...prev, {
        id: `u-${Date.now()}`,
        name: formName,
        email: formEmail,
        role: formRole,
        status: 'active',
      }]);
    }
    setDialogOpen(false);
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
      : u
    ));
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-running" /> {activeCount} ativos</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> {users.length - activeCount} inativos</span>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Usuário</TableHead>
              <TableHead className="text-[11px]">E-mail</TableHead>
              <TableHead className="text-[11px]">Função</TableHead>
              <TableHead className="text-[11px]">Status</TableHead>
              <TableHead className="text-[11px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${roleBadgeStyles[user.role]}`}>
                    {user.role === 'admin' && <Crown className="h-2.5 w-2.5 mr-1" />}
                    {user.role === 'leadership' && <ShieldCheck className="h-2.5 w-2.5 mr-1" />}
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(user.id)}>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-[10px] cursor-pointer">
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Nome</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome completo" className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">E-mail</Label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@empresa.com" className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Função</Label>
              <Select value={formRole} onValueChange={(v: UserRecord['role']) => setFormRole(v)}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="leadership">Liderança</SelectItem>
                  <SelectItem value="operator">Operação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim() || !formEmail.trim()} className="text-xs">
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Products Tab (with multi-line association) ───

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formLineIds, setFormLineIds] = useState<string[]>([]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormName(''); setFormSku(''); setFormCategory(''); setFormNominal(''); setFormLineIds([]);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name); setFormSku(product.sku);
    setFormCategory(product.category); setFormNominal(String(product.nominalSpeed));
    setFormLineIds(product.lineIds);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id
        ? { ...p, name: formName, sku: formSku, category: formCategory, nominalSpeed: Number(formNominal) || 0, lineIds: formLineIds }
        : p
      ));
    } else {
      setProducts(prev => [...prev, {
        id: `p-${Date.now()}`,
        name: formName,
        sku: formSku,
        category: formCategory,
        nominalSpeed: Number(formNominal) || 0,
        lineIds: formLineIds,
      }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleLine = (lineId: string) => {
    setFormLineIds(prev => prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId]);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {categories.map(cat => (
            <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
          ))}
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Produto
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Produto</TableHead>
              <TableHead className="text-[11px]">SKU</TableHead>
              <TableHead className="text-[11px]">Categoria</TableHead>
              <TableHead className="text-[11px]">Vel. Nominal</TableHead>
              <TableHead className="text-[11px]">Linhas</TableHead>
              <TableHead className="text-[11px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <Package className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground">{product.sku}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">{product.nominalSpeed} u/h</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {product.lineIds.map(lid => {
                      const line = mockLines.find(l => l.id === lid);
                      return line ? (
                        <Badge key={lid} variant="outline" className="text-[9px]">{line.name}</Badge>
                      ) : null;
                    })}
                    {product.lineIds.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(product)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Nome do Produto</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Água Mineral 500ml" className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">SKU</Label>
                <Input value={formSku} onChange={e => setFormSku(e.target.value)} placeholder="SKU-101" className="h-8 text-sm mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-[11px]">Categoria</Label>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Bebidas" className="h-8 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[11px]">Velocidade Nominal (u/h)</Label>
              <Input type="number" value={formNominal} onChange={e => setFormNominal(e.target.value)} placeholder="500" className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Linhas de Produção</Label>
              <div className="flex flex-wrap gap-2 mt-1.5 p-2.5 rounded-md border bg-muted/20">
                {mockLines.map(line => (
                  <label key={line.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={formLineIds.includes(line.id)}
                      onCheckedChange={() => toggleLine(line.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-foreground">{line.name}</span>
                  </label>
                ))}
                {mockLines.length === 0 && <span className="text-[10px] text-muted-foreground">Nenhuma linha cadastrada</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim() || !formSku.trim()} className="text-xs">
              {editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shifts Tab ───

function ShiftsTab() {
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formName, setFormName] = useState('');
  const [formStart, setFormStart] = useState('06:00');
  const [formEnd, setFormEnd] = useState('14:00');
  const [formDays, setFormDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);

  const openCreate = () => {
    setEditingShift(null);
    setFormName(''); setFormStart('06:00'); setFormEnd('14:00');
    setFormDays(['seg', 'ter', 'qua', 'qui', 'sex']);
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormName(shift.name); setFormStart(shift.startTime); setFormEnd(shift.endTime);
    setFormDays(shift.days);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingShift) {
      setShifts(prev => prev.map(s => s.id === editingShift.id
        ? { ...s, name: formName, startTime: formStart, endTime: formEnd, days: formDays }
        : s
      ));
    } else {
      setShifts(prev => [...prev, {
        id: `sh-${Date.now()}`,
        name: formName,
        startTime: formStart,
        endTime: formEnd,
        days: formDays,
      }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const toggleDay = (day: string) => {
    setFormDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const computeDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}min` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{shifts.length} turnos cadastrados</p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Turno
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Turno</TableHead>
              <TableHead className="text-[11px]">Horário</TableHead>
              <TableHead className="text-[11px]">Duração</TableHead>
              <TableHead className="text-[11px]">Dias</TableHead>
              <TableHead className="text-[11px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map(shift => (
              <TableRow key={shift.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
                      <Clock className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{shift.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground">{shift.startTime} — {shift.endTime}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{computeDuration(shift.startTime, shift.endTime)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {ALL_DAYS.map(day => (
                      <span
                        key={day}
                        className={`text-[9px] font-medium w-5 h-5 rounded flex items-center justify-center ${
                          shift.days.includes(day)
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/30 text-muted-foreground/40'
                        }`}
                      >
                        {DAY_LABELS[day]?.[0]}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(shift)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(shift.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingShift ? 'Editar Turno' : 'Novo Turno'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Nome do Turno</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Turno A — Manhã" className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Início</Label>
                <Input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Fim</Label>
                <Input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[11px]">Dias da Semana</Label>
              <div className="flex gap-1.5 mt-1.5">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-9 h-8 rounded-md text-[11px] font-medium transition-colors border ${
                      formDays.includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
            {formStart && formEnd && (
              <p className="text-[10px] text-muted-foreground">
                Duração: <span className="font-medium text-foreground">{computeDuration(formStart, formEnd)}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim() || formDays.length === 0} className="text-xs">
              {editingShift ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Assignments Tab (Operator → Equipment / Equipment Group) ───

function AssignmentsTab() {
  const [assignments, setAssignments] = useState<OperatorAssignment[]>(MOCK_ASSIGNMENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<OperatorAssignment | null>(null);
  const [formOperatorId, setFormOperatorId] = useState('');
  const [formLineId, setFormLineId] = useState(mockLines[0]?.id || '');
  const [formEquipmentIds, setFormEquipmentIds] = useState<string[]>([]);
  const [formShiftIds, setFormShiftIds] = useState<string[]>([]);

  const operators = MOCK_USERS.filter(u => u.role === 'operator' && u.status === 'active');

  const openCreate = () => {
    setEditingAssignment(null);
    setFormOperatorId(''); setFormLineId(mockLines[0]?.id || ''); setFormEquipmentIds([]); setFormShiftIds([]);
    setDialogOpen(true);
  };

  const openEdit = (a: OperatorAssignment) => {
    setEditingAssignment(a);
    setFormOperatorId(a.operatorId); setFormLineId(a.lineId); setFormEquipmentIds(a.equipmentIds); setFormShiftIds(a.shiftIds);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingAssignment) {
      setAssignments(prev => prev.map(a => a.id === editingAssignment.id
        ? { ...a, operatorId: formOperatorId, lineId: formLineId, equipmentIds: formEquipmentIds, shiftIds: formShiftIds }
        : a
      ));
    } else {
      setAssignments(prev => [...prev, {
        id: `a-${Date.now()}`,
        operatorId: formOperatorId,
        lineId: formLineId,
        equipmentIds: formEquipmentIds,
        shiftIds: formShiftIds,
      }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const toggleEquipment = (eqId: string) => {
    setFormEquipmentIds(prev => prev.includes(eqId) ? prev.filter(e => e !== eqId) : [...prev, eqId]);
  };

  const selectAllEquipments = () => {
    const lineEquips = mockEquipments.filter(e => e.lineId === formLineId);
    setFormEquipmentIds(lineEquips.map(e => e.id));
  };

  const toggleShift = (shiftId: string) => {
    setFormShiftIds(prev => prev.includes(shiftId) ? prev.filter(s => s !== shiftId) : [...prev, shiftId]);
  };

  const lineEquipmentsForForm = mockEquipments.filter(e => e.lineId === formLineId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Vincule operadores a equipamentos ou grupos de equipamentos
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Vínculo
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Operador</TableHead>
              <TableHead className="text-[11px]">Linha</TableHead>
              <TableHead className="text-[11px]">Equipamentos</TableHead>
              <TableHead className="text-[11px]">Turnos</TableHead>
              <TableHead className="text-[11px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map(a => {
              const user = MOCK_USERS.find(u => u.id === a.operatorId);
              const line = mockLines.find(l => l.id === a.lineId);
              const lineEquips = mockEquipments.filter(e => e.lineId === a.lineId);
              const allSelected = lineEquips.length > 0 && a.equipmentIds.length === lineEquips.length;

              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{user?.name ?? a.operatorId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{line?.name ?? a.lineId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {allSelected ? (
                        <Badge variant="secondary" className="text-[10px]">Todos ({lineEquips.length})</Badge>
                      ) : (
                        a.equipmentIds.map(eqId => {
                          const eq = mockEquipments.find(e => e.id === eqId);
                          return <Badge key={eqId} variant="outline" className="text-[9px]">{eq?.name ?? eqId}</Badge>;
                        })
                      )}
                      {a.equipmentIds.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {a.shiftIds.map(sid => {
                        const shift = MOCK_SHIFTS.find(s => s.id === sid);
                        return <Badge key={sid} variant="secondary" className="text-[9px]">{shift?.name ?? sid}</Badge>;
                      })}
                      {a.shiftIds.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                  Nenhum vínculo cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingAssignment ? 'Editar Vínculo' : 'Novo Vínculo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Operador</Label>
              <Select value={formOperatorId} onValueChange={setFormOperatorId}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Selecione um operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Linha de Produção</Label>
              <Select
                value={formLineId}
                onValueChange={v => { setFormLineId(v); setFormEquipmentIds([]); }}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockLines.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Equipamentos</Label>
                <button
                  type="button"
                  onClick={selectAllEquipments}
                  className="text-[10px] text-primary hover:underline"
                >
                  Selecionar todos
                </button>
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5 p-2.5 rounded-md border bg-muted/20 max-h-40 overflow-y-auto">
                {lineEquipmentsForForm.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">Nenhum equipamento nesta linha</span>
                )}
                {lineEquipmentsForForm.sort((a, b) => a.position - b.position).map(eq => (
                  <label key={eq.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formEquipmentIds.includes(eq.id)}
                      onCheckedChange={() => toggleEquipment(eq.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-[9px] font-mono text-primary">{eq.position}</span>
                    <span className="text-[11px] text-foreground">{eq.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{eq.type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formOperatorId || formEquipmentIds.length === 0} className="text-xs">
              {editingAssignment ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stop Categories Tab ───

function StopCategoriesTab() {
  const [categories, setCategories] = useState<StopCategoryRecord[]>(MOCK_STOP_CATS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<StopCategoryRecord | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState('hsl(0, 72%, 51%)');
  const [formPlanned, setFormPlanned] = useState(false);

  const openCreate = () => {
    setEditingCat(null);
    setFormLabel(''); setFormColor('hsl(0, 72%, 51%)'); setFormPlanned(false);
    setDialogOpen(true);
  };

  const openEdit = (cat: StopCategoryRecord) => {
    setEditingCat(cat);
    setFormLabel(cat.label); setFormColor(cat.color); setFormPlanned(cat.isPlanned);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCat) {
      setCategories(prev => prev.map(c => c.id === editingCat.id
        ? { ...c, label: formLabel, color: formColor, isPlanned: formPlanned }
        : c
      ));
    } else {
      const code = formLabel.toLowerCase().replace(/\s+/g, '_') as StopCategory;
      setCategories(prev => [...prev, {
        id: code,
        code,
        label: formLabel,
        color: formColor,
        isPlanned: formPlanned,
      }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const plannedCount = categories.filter(c => c.isPlanned).length;
  const unplannedCount = categories.length - plannedCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{plannedCount} planejadas</span>
          <span className="text-border">·</span>
          <span>{unplannedCount} não planejadas</span>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Nova Categoria
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Cor</TableHead>
              <TableHead className="text-[11px]">Categoria</TableHead>
              <TableHead className="text-[11px]">Tipo</TableHead>
              <TableHead className="text-[11px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="h-5 w-5 rounded-md border" style={{ backgroundColor: cat.color }} />
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={cat.isPlanned ? 'secondary' : 'outline'} className="text-[10px]">
                    {cat.isPlanned ? 'Planejada' : 'Não planejada'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Nome da Categoria</Label>
              <Input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Ex: Manutenção Corretiva" className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Cor</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formColor.startsWith('hsl') ? '#e74c3c' : formColor}
                    onChange={e => setFormColor(e.target.value)}
                    className="h-8 w-10 rounded border cursor-pointer"
                  />
                  <div className="h-8 flex-1 rounded-md border" style={{ backgroundColor: formColor }} />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Tipo</Label>
                <Select value={formPlanned ? 'planned' : 'unplanned'} onValueChange={v => setFormPlanned(v === 'planned')}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejada</SelectItem>
                    <SelectItem value="unplanned">Não planejada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formLabel.trim()} className="text-xs">
              {editingCat ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Structure Tab ───

type DialogType = 'site' | 'line' | 'equipment' | 'flow' | 'transport';
type DialogMode = 'create' | 'edit';

function StructureTab() {
  const [sites, setSites] = useState<Site[]>(mockSites);
  const [lines, setLines] = useState<ProductionLine[]>(mockLines);
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments);
  const [flows, setFlows] = useState<ProductionFlow[]>(mockFlows);

  const [expandedSite, setExpandedSite] = useState<string | null>('site-1');
  const [expandedLine, setExpandedLine] = useState<string | null>('line-1');
  const [activeTab, setActiveTab] = useState<'equipments' | 'flows' | 'transports'>('equipments');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('site');
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogContext, setDialogContext] = useState<string>('');

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCapacity, setFormCapacity] = useState('');

  const resetForm = () => {
    setFormName(''); setFormType(''); setFormLocation('');
    setFormNominal(''); setFormSku(''); setFormCapacity('');
  };

  const openCreateDialog = (type: DialogType, contextId = '') => {
    setDialogType(type); setDialogMode('create'); setDialogContext(contextId);
    setEditingId(null); resetForm(); setDialogOpen(true);
  };

  const openEditDialog = (type: DialogType, id: string) => {
    setDialogType(type); setDialogMode('edit'); setEditingId(id);
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
        if (newPosition > 1) {
          const transportId = `transport-${Date.now()}`;
          const newTransport: Transport = {
            id: transportId, fromPosition: newPosition - 1, toPosition: newPosition,
            lineId: dialogContext, type: 'conveyor', accumulation: 'normal',
            accumulationPercent: 0, capacity: 50, currentUnits: 0,
          };
          setLines(prev => prev.map(l => l.id === dialogContext
            ? { ...l, transports: [...l.transports, newTransport] } : l
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

  const handleDelete = (type: DialogType, id: string) => {
    if (type === 'site') { setSites(prev => prev.filter(s => s.id !== id)); setLines(prev => prev.filter(l => l.siteId !== id)); }
    else if (type === 'line') { setLines(prev => prev.filter(l => l.id !== id)); setEquipments(prev => prev.filter(e => e.lineId !== id)); setFlows(prev => prev.filter(f => f.lineId !== id)); }
    else if (type === 'equipment') { setEquipments(prev => prev.filter(e => e.id !== id)); }
    else if (type === 'flow') { setFlows(prev => prev.filter(f => f.id !== id)); }
  };

  const dialogTitles: Record<string, Record<string, string>> = {
    site: { create: 'Novo Site', edit: 'Editar Site' },
    line: { create: 'Nova Linha', edit: 'Editar Linha' },
    equipment: { create: 'Novo Equipamento', edit: 'Editar Equipamento' },
    flow: { create: 'Novo Fluxo', edit: 'Editar Fluxo' },
    transport: { create: 'Novo Transporte', edit: 'Editar Transporte' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => openCreateDialog('site')} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Novo Site
        </Button>
      </div>

      <div className="space-y-3">
        {sites.map(site => {
          const siteLines = lines.filter(l => l.siteId === site.id);
          const isExpanded = expandedSite === site.id;

          return (
            <div key={site.id} className="rounded-lg border bg-card overflow-hidden">
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

              {isExpanded && (
                <div className="border-t">
                  {siteLines.length === 0 && (
                    <p className="px-8 py-4 text-[11px] text-muted-foreground italic">Nenhuma linha cadastrada.</p>
                  )}
                  {siteLines.map(line => {
                    const lineEquips = equipments.filter(e => e.lineId === line.id);
                    const lineFlows = flows.filter(f => f.lineId === line.id);
                    const lineTransports = line.transports || [];
                    const isLineExpanded = expandedLine === line.id;

                    return (
                      <div key={line.id} className="border-b last:border-b-0">
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
                                {line.type} · {lineEquips.length} equip. · {lineFlows.length} fluxos · {line.nominalSpeed} u/h
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

                        {isLineExpanded && (
                          <div className="bg-muted/10 border-t">
                            <div className="flex items-center gap-0 px-8 pt-2">
                              {(['equipments', 'flows', 'transports'] as const).map(tab => {
                                const icons = { equipments: Cog, flows: GitBranch, transports: ArrowRightLeft };
                                const labels = {
                                  equipments: `Equipamentos (${lineEquips.length})`,
                                  flows: `Fluxos (${lineFlows.length})`,
                                  transports: `Transportes (${lineTransports.length})`,
                                };
                                const Icon = icons[tab];
                                return (
                                  <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 text-[11px] font-medium rounded-t-md transition-colors ${activeTab === tab ? 'bg-card text-foreground border border-b-0' : 'text-muted-foreground hover:text-foreground'}`}
                                  >
                                    <Icon className="h-3 w-3 inline mr-1" /> {labels[tab]}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="bg-card mx-8 mb-3 rounded-b-md rounded-tr-md border p-3">
                              {activeTab === 'equipments' && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-end mb-2">
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openCreateDialog('equipment', line.id)}>
                                      <Plus className="h-3 w-3" /> Equipamento
                                    </Button>
                                  </div>
                                  {lineEquips.length === 0 && <p className="text-[11px] text-muted-foreground italic text-center py-2">Nenhum equipamento.</p>}
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
                                  {lineFlows.length === 0 && <p className="text-[11px] text-muted-foreground italic text-center py-2">Nenhum fluxo.</p>}
                                  {lineFlows.map(flow => {
                                    const flowEquips = equipments.filter(e => flow.equipmentIds.includes(e.id));
                                    return (
                                      <div key={flow.id} className="px-3 py-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-[11px] font-medium text-foreground">{flow.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                              SKU: <span className="font-mono font-medium text-foreground">{flow.sku}</span> · {flow.nominalSpeed} u/h
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

                              {activeTab === 'transports' && (
                                <div className="space-y-1.5">
                                  {lineTransports.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground italic text-center py-2">Transportes são criados ao adicionar equipamentos.</p>
                                  )}
                                  {lineTransports.sort((a, b) => a.fromPosition - b.fromPosition).map(transport => {
                                    const fromEquip = lineEquips.find(e => e.position === transport.fromPosition);
                                    const toEquip = lineEquips.find(e => e.position === transport.toPosition);
                                    return (
                                      <div key={transport.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                          <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                          <div>
                                            <p className="text-[11px] font-medium text-foreground">
                                              {fromEquip?.name ?? `Pos ${transport.fromPosition}`}
                                              <span className="text-muted-foreground mx-1">→</span>
                                              {toEquip?.name ?? `Pos ${transport.toPosition}`}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground capitalize">{transport.type}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-[10px] gap-1">Cap: {transport.capacity} un</Badge>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog('transport', transport.id)}>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                          </Button>
                                        </div>
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

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {dialogTitles[dialogType]?.[dialogMode] || 'Configuração'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {dialogType !== 'transport' && (
              <div>
                <Label className="text-[11px]">Nome</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome" className="h-8 text-sm mt-1" />
              </div>
            )}
            {dialogType === 'site' && (
              <div>
                <Label className="text-[11px]">Localização</Label>
                <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Cidade, Estado" className="h-8 text-sm mt-1" />
              </div>
            )}
            {(dialogType === 'line' || dialogType === 'equipment' || dialogType === 'transport') && (
              <div>
                <Label className="text-[11px]">Tipo</Label>
                <Input value={formType} onChange={e => setFormType(e.target.value)}
                  placeholder={dialogType === 'transport' ? 'conveyor, buffer, gravity' : 'Ex: Envase, Processor'}
                  className="h-8 text-sm mt-1"
                />
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
            {dialogType === 'transport' && (
              <div>
                <Label className="text-[11px]">Capacidade (unidades)</Label>
                <Input type="number" value={formCapacity} onChange={e => setFormCapacity(e.target.value)} placeholder="50" className="h-8 text-sm mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={dialogType !== 'transport' && !formName.trim()} className="text-xs">
              {dialogMode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
