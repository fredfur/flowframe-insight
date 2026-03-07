import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLines } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import { Settings, Factory, Tag } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5" /> Configurações
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie linhas, máquinas e categorias de parada.
        </p>
      </div>

      {/* Lines overview */}
      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Factory className="h-4 w-4" /> Linhas de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {mockLines.map((line) => (
            <div key={line.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{line.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Tipo: {line.type} • {line.machines.length} máquinas • Vel. nominal: {line.nominalSpeed} u/h
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">{line.id}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stop categories */}
      <Card className="bg-card border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4" /> Categorias de Parada
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {STOP_CATEGORIES.map((cat) => (
              <Badge key={cat.id} variant="outline" style={{ borderColor: cat.color, color: cat.color }}>
                {cat.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ⚠️ Editor drag & drop e cadastro completo serão habilitados após configuração do backend.
      </p>
    </div>
  );
}
