import { Badge } from '@/components/ui/badge';
import { mockLines } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import { Settings, Factory, Tag } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4" /> Configurações
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Gerencie linhas, máquinas e categorias de parada.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <p className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
            <Factory className="h-3.5 w-3.5 text-muted-foreground" /> Linhas de Produção
          </p>
        </div>
        <div className="divide-y">
          {mockLines.map((line) => (
            <div key={line.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[12px] font-medium text-foreground">{line.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {line.type} · {line.machines.length} máquinas · {line.nominalSpeed} u/h
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{line.id}</Badge>
            </div>
          ))}
        </div>
      </div>

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
        Editor drag & drop e cadastro completo serão habilitados após configuração do backend.
      </p>
    </div>
  );
}
