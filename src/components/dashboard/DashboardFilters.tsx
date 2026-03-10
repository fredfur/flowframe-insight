import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockLines } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';

export interface DashboardFilterValues {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  lineId: string;
  stopCategory: string;
  machineStatus: string;
  shift: string;
}

const SHIFTS = [
  { id: 'all', label: 'Todos os Turnos' },
  { id: 'morning', label: 'Manhã (06–14h)' },
  { id: 'afternoon', label: 'Tarde (14–22h)' },
  { id: 'night', label: 'Noite (22–06h)' },
];

const MACHINE_STATUSES = [
  { id: 'all', label: 'Todos os Status' },
  { id: 'running', label: 'Em Operação' },
  { id: 'fault', label: 'Falha' },
  { id: 'setup', label: 'Setup' },
  { id: 'shortage', label: 'Falta Material' },
  { id: 'scheduled', label: 'Parada Planejada' },
  { id: 'disconnected', label: 'Desconectado' },
];

interface DashboardFiltersProps {
  filters: DashboardFilterValues;
  onChange: (filters: DashboardFilterValues) => void;
}

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.lineId !== 'all' ? filters.lineId : null,
    filters.stopCategory !== 'all' ? filters.stopCategory : null,
    filters.machineStatus !== 'all' ? filters.machineStatus : null,
    filters.shift !== 'all' ? filters.shift : null,
  ].filter(Boolean).length;

  const update = (partial: Partial<DashboardFilterValues>) => {
    onChange({ ...filters, ...partial });
  };

  const clearAll = () => {
    onChange({
      dateFrom: undefined,
      dateTo: undefined,
      lineId: 'all',
      stopCategory: 'all',
      machineStatus: 'all',
      shift: 'all',
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] rounded-full">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-3 space-y-3" align="start">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Filtros do Dashboard</p>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground" onClick={clearAll}>
                Limpar tudo
              </Button>
            )}
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Período</p>
            <div className="grid grid-cols-2 gap-2">
              <DatePickerField label="De" date={filters.dateFrom} onSelect={(d) => update({ dateFrom: d })} />
              <DatePickerField label="Até" date={filters.dateTo} onSelect={(d) => update({ dateTo: d })} />
            </div>
          </div>

          {/* Line */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Linha</p>
            <Select value={filters.lineId} onValueChange={(v) => update({ lineId: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Linhas</SelectItem>
                {mockLines.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stop category */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Tipo de Parada</p>
            <Select value={filters.stopCategory} onValueChange={(v) => update({ stopCategory: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Paradas</SelectItem>
                {STOP_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Machine status */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Status da Máquina</p>
            <Select value={filters.machineStatus} onValueChange={(v) => update({ machineStatus: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Turno</p>
            <Select value={filters.shift} onValueChange={(v) => update({ shift: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {filters.lineId !== 'all' && (
        <FilterChip label={mockLines.find(l => l.id === filters.lineId)?.name || filters.lineId} onRemove={() => update({ lineId: 'all' })} />
      )}
      {filters.stopCategory !== 'all' && (
        <FilterChip label={STOP_CATEGORIES.find(c => c.id === filters.stopCategory)?.label || filters.stopCategory} onRemove={() => update({ stopCategory: 'all' })} />
      )}
      {filters.machineStatus !== 'all' && (
        <FilterChip label={MACHINE_STATUSES.find(s => s.id === filters.machineStatus)?.label || filters.machineStatus} onRemove={() => update({ machineStatus: 'all' })} />
      )}
      {filters.shift !== 'all' && (
        <FilterChip label={SHIFTS.find(s => s.id === filters.shift)?.label || filters.shift} onRemove={() => update({ shift: 'all' })} />
      )}
      {filters.dateFrom && (
        <FilterChip label={`De ${format(filters.dateFrom, 'dd/MM')}`} onRemove={() => update({ dateFrom: undefined })} />
      )}
      {filters.dateTo && (
        <FilterChip label={`Até ${format(filters.dateTo, 'dd/MM')}`} onRemove={() => update({ dateTo: undefined })} />
      )}
    </div>
  );
}

function DatePickerField({ label, date, onSelect }: { label: string; date: Date | undefined; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 w-full justify-start text-xs gap-1.5', !date && 'text-muted-foreground')}>
          <CalendarIcon className="h-3 w-3" />
          {date ? format(date, 'dd/MM/yy') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="h-6 gap-1 text-[10px] pl-2 pr-1 font-normal">
      {label}
      <button onClick={onRemove} className="rounded-full hover:bg-muted p-0.5">
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}

export const DEFAULT_FILTERS: DashboardFilterValues = {
  dateFrom: undefined,
  dateTo: undefined,
  lineId: 'all',
  stopCategory: 'all',
  machineStatus: 'all',
  shift: 'all',
};
