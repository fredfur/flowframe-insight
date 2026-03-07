import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, BarChart3, AlertTriangle, Zap, TrendingDown, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import type { LucideIcon } from 'lucide-react';

// ─── Types ───

interface ChartData {
  type: 'bar' | 'line';
  title: string;
  data: Record<string, string | number>[];
  dataKeys: { key: string; color: string; name: string }[];
  xKey: string;
}

interface FollowUp {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

interface AIResponse {
  content: string;
  chart?: ChartData;
  followUps: FollowUp[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart?: ChartData;
  followUps?: FollowUp[];
  timestamp: Date;
}

// ─── Mock response data ───

const RESPONSES: Record<string, AIResponse> = {
  default: {
    content: `Baseado nos dados atuais da linha, aqui está o que posso informar:

- **OEE geral**: 69.2% (abaixo da meta de 75%)
- **Principal gargalo**: Inspeção Visual com disponibilidade de 70%
- **Vazão atual**: 380 u/h vs nominal de 500 u/h

Posso detalhar qualquer um desses pontos.`,
    followUps: [
      { icon: BarChart3, label: 'Detalhar OEE', prompt: 'Detalhe o OEE atual com gráfico' },
      { icon: AlertTriangle, label: 'Ver paradas', prompt: 'Quais as paradas recentes?' },
      { icon: Zap, label: 'Analisar gargalo', prompt: 'Onde está o gargalo da linha agora?' },
    ],
  },

  parada: {
    content: `Analisando as paradas recentes:

1. **Inspeção Visual** — Falha de sensor (ativa desde 08:30)
2. **Processadora B** — Setup para SKU-204 (25min)
3. **Alimentador** — Falta de material (resolvida)

A parada mais impactante é a da **Inspeção Visual**, que está limitando a vazão da linha inteira.`,
    chart: {
      type: 'bar',
      title: 'Tempo de Parada por Equipamento (min)',
      xKey: 'machine',
      data: [
        { machine: 'Inspeção Visual', minutes: 180 },
        { machine: 'Processadora B', minutes: 25 },
        { machine: 'Alimentador', minutes: 12 },
        { machine: 'Embaladora', minutes: 5 },
      ],
      dataKeys: [{ key: 'minutes', color: 'hsl(var(--destructive))', name: 'Minutos' }],
    },
    followUps: [
      { icon: Zap, label: 'Impacto no OEE', prompt: 'Qual o impacto dessas paradas no OEE?' },
      { icon: Clock, label: 'Histórico de paradas', prompt: 'Mostre o histórico de paradas da semana' },
      { icon: Activity, label: 'Status atual', prompt: 'Qual o status atual de cada máquina?' },
    ],
  },

  oee: {
    content: `O OEE atual da linha é **69.2%**, composto por:

| Componente | Valor | Meta |
|---|---|---|
| Disponibilidade | 81.4% | 90% |
| Performance | 87.0% | 95% |
| Qualidade | 97.8% | 99% |

O maior gap está na **Disponibilidade** — as paradas não planejadas estão consumindo 18.6% do tempo produtivo.`,
    chart: {
      type: 'bar',
      title: 'OEE — Componentes vs. Meta',
      xKey: 'component',
      data: [
        { component: 'Disponibilidade', atual: 81.4, meta: 90 },
        { component: 'Performance', atual: 87.0, meta: 95 },
        { component: 'Qualidade', atual: 97.8, meta: 99 },
      ],
      dataKeys: [
        { key: 'atual', color: 'hsl(var(--primary))', name: 'Atual' },
        { key: 'meta', color: 'hsl(var(--muted-foreground))', name: 'Meta' },
      ],
    },
    followUps: [
      { icon: TrendingDown, label: 'Tendência semanal', prompt: 'Mostre a tendência do OEE na última semana' },
      { icon: AlertTriangle, label: 'Causas raiz', prompt: 'Quais as causas raiz da queda de disponibilidade?' },
      { icon: BarChart3, label: 'OEE por máquina', prompt: 'Compare o OEE entre máquinas' },
    ],
  },

  gargalo: {
    content: `O gargalo atual da linha é a **Inspeção Visual**:

- **Status**: Falha de sensor de câmera desde 08:30
- **Disponibilidade**: 70% (vs. >90% das demais)
- **Impacto estimado**: -150 u/h na vazão da linha

### Recomendações:
1. Priorizar manutenção corretiva do sensor
2. Avaliar bypass temporário com inspeção manual
3. Verificar estoque de peças sobressalentes`,
    chart: {
      type: 'bar',
      title: 'Disponibilidade por Máquina (%)',
      xKey: 'machine',
      data: [
        { machine: 'Alimentador', value: 95 },
        { machine: 'Process. A', value: 90 },
        { machine: 'Inspeção', value: 70 },
        { machine: 'Process. B', value: 60 },
        { machine: 'Embaladora', value: 92 },
      ],
      dataKeys: [{ key: 'value', color: 'hsl(var(--primary))', name: 'Disponibilidade' }],
    },
    followUps: [
      { icon: Clock, label: 'Tempo estimado', prompt: 'Quanto tempo para resolver o gargalo?' },
      { icon: Activity, label: 'Vazão em tempo real', prompt: 'Mostre a vazão em tempo real da linha' },
      { icon: TrendingDown, label: 'Impacto financeiro', prompt: 'Qual o impacto financeiro do gargalo?' },
    ],
  },

  turno: {
    content: `Comparativo de turnos (últimas 24h):

| Turno | OEE | Disponibilidade | Performance |
|---|---|---|---|
| 1º Turno | 78.5% | 89.2% | 92.1% |
| 2º Turno | 71.3% | 83.4% | 88.7% |
| 3º Turno | 65.1% | 77.8% | 85.2% |

O **1º Turno** lidera em todos os indicadores. A queda progressiva sugere acúmulo de desgaste nos equipamentos.`,
    chart: {
      type: 'bar',
      title: 'OEE por Turno',
      xKey: 'turno',
      data: [
        { turno: '1º Turno', oee: 78.5, disponibilidade: 89.2, performance: 92.1 },
        { turno: '2º Turno', oee: 71.3, disponibilidade: 83.4, performance: 88.7 },
        { turno: '3º Turno', oee: 65.1, disponibilidade: 77.8, performance: 85.2 },
      ],
      dataKeys: [
        { key: 'oee', color: 'hsl(var(--primary))', name: 'OEE' },
        { key: 'disponibilidade', color: 'hsl(210 50% 55%)', name: 'Disponibilidade' },
        { key: 'performance', color: 'hsl(38 90% 55%)', name: 'Performance' },
      ],
    },
    followUps: [
      { icon: Clock, label: 'Detalhes 3º turno', prompt: 'Por que o 3º turno tem pior desempenho?' },
      { icon: BarChart3, label: 'Evolução semanal', prompt: 'Mostre a evolução dos turnos na semana' },
      { icon: Activity, label: 'Melhores práticas', prompt: 'O que o 1º turno faz diferente?' },
    ],
  },

  tendencia: {
    content: `Tendência do OEE nos últimos 7 dias:

A linha mostra uma **queda gradual** de 75% para 69%, com pico de recuperação na quarta-feira após manutenção preventiva.

A tendência sugere que intervenções programadas a cada 3 dias podem estabilizar o OEE acima de 73%.`,
    chart: {
      type: 'line',
      title: 'OEE — Últimos 7 Dias',
      xKey: 'dia',
      data: [
        { dia: 'Seg', oee: 75, meta: 75 },
        { dia: 'Ter', oee: 73, meta: 75 },
        { dia: 'Qua', oee: 76, meta: 75 },
        { dia: 'Qui', oee: 72, meta: 75 },
        { dia: 'Sex', oee: 70, meta: 75 },
        { dia: 'Sáb', oee: 71, meta: 75 },
        { dia: 'Dom', oee: 69, meta: 75 },
      ],
      dataKeys: [
        { key: 'oee', color: 'hsl(var(--primary))', name: 'OEE' },
        { key: 'meta', color: 'hsl(var(--muted-foreground))', name: 'Meta' },
      ],
    },
    followUps: [
      { icon: AlertTriangle, label: 'Causas da queda', prompt: 'Quais eventos causaram a queda na sexta?' },
      { icon: Zap, label: 'Previsão', prompt: 'Qual a previsão de OEE para amanhã?' },
      { icon: BarChart3, label: 'Comparar linhas', prompt: 'Compare o OEE entre as linhas' },
    ],
  },

  vazao: {
    content: `Vazão em tempo real da linha nas últimas 8 horas:

A vazão oscila entre **280–430 u/h** com média de **380 u/h** (76% do nominal). As quedas estão correlacionadas com as paradas da Inspeção Visual.`,
    chart: {
      type: 'line',
      title: 'Vazão Real vs. Nominal (u/h)',
      xKey: 'hora',
      data: [
        { hora: '22:00', real: 420, nominal: 500 },
        { hora: '23:00', real: 380, nominal: 500 },
        { hora: '00:00', real: 280, nominal: 500 },
        { hora: '01:00', real: 350, nominal: 500 },
        { hora: '02:00', real: 430, nominal: 500 },
        { hora: '03:00', real: 400, nominal: 500 },
        { hora: '04:00', real: 370, nominal: 500 },
        { hora: '05:00', real: 390, nominal: 500 },
      ],
      dataKeys: [
        { key: 'real', color: 'hsl(var(--primary))', name: 'Vazão Real' },
        { key: 'nominal', color: 'hsl(var(--muted-foreground))', name: 'Nominal' },
      ],
    },
    followUps: [
      { icon: Zap, label: 'Otimizar vazão', prompt: 'Como posso aumentar a vazão da linha?' },
      { icon: BarChart3, label: 'Vazão por máquina', prompt: 'Mostre a vazão de cada máquina' },
      { icon: TrendingDown, label: 'Perdas acumuladas', prompt: 'Quantas unidades perdemos hoje?' },
    ],
  },
};

function getResponse(input: string): AIResponse {
  const lower = input.toLowerCase();
  if (lower.includes('parada') || lower.includes('stop')) return RESPONSES.parada;
  if (lower.includes('oee') || lower.includes('disponibilidade') || lower.includes('performance') || lower.includes('melhor')) return RESPONSES.oee;
  if (lower.includes('gargalo') || lower.includes('bottleneck')) return RESPONSES.gargalo;
  if (lower.includes('turno') || lower.includes('shift') || lower.includes('compare')) return RESPONSES.turno;
  if (lower.includes('tendência') || lower.includes('tendencia') || lower.includes('semana') || lower.includes('evolução')) return RESPONSES.tendencia;
  if (lower.includes('vazão') || lower.includes('tempo real') || lower.includes('status')) return RESPONSES.vazao;
  return RESPONSES.default;
}

// ─── Initial prompt cards ───

const INITIAL_CARDS: { icon: LucideIcon; title: string; prompt: string }[] = [
  { icon: BarChart3, title: 'Análise de OEE', prompt: 'Qual o OEE atual e como posso melhorá-lo?' },
  { icon: AlertTriangle, title: 'Paradas recentes', prompt: 'Resuma as paradas recentes e seus impactos' },
  { icon: Zap, title: 'Gargalo da linha', prompt: 'Onde está o gargalo da linha agora?' },
  { icon: TrendingDown, title: 'Comparativo de turnos', prompt: 'Compare a performance entre os turnos' },
];

// ─── Inline Chart Component ───

function InlineChart({ chart }: { chart: ChartData }) {
  const ChartComponent = chart.type === 'line' ? LineChart : BarChart;

  return (
    <div className="rounded-lg border bg-background/50 p-3 mt-2">
      <p className="text-[10px] font-medium text-muted-foreground mb-2">{chart.title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <ChartComponent data={chart.data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={chart.xKey}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          {chart.dataKeys.map((dk) =>
            chart.type === 'line' ? (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                stroke={dk.color}
                strokeWidth={1.5}
                dot={{ r: 2 }}
                name={dk.name}
              />
            ) : (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                fill={dk.color}
                radius={[3, 3, 0, 0]}
                name={dk.name}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Follow-up Cards ───

function FollowUpCards({ followUps, onSelect }: { followUps: FollowUp[]; onSelect: (prompt: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap mt-3">
      {followUps.map((fu) => (
        <button
          key={fu.label}
          onClick={() => onSelect(fu.prompt)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-background/50 text-[10px] font-medium text-foreground hover:bg-accent transition-colors"
        >
          <fu.icon className="h-3 w-3 text-primary" />
          {fu.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───

export default function Assistente() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = getResponse(text);
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        chart: response.chart,
        followUps: response.followUps,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, delay);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-48px-48px)] max-w-3xl mx-auto">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-sm font-semibold text-foreground">Assistente de Produção</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Pergunte sobre OEE, paradas, gargalos ou tendências. Analiso seus dados em tempo real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {INITIAL_CARDS.map((card) => (
                <button
                  key={card.title}
                  onClick={() => sendMessage(card.prompt)}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0 group-hover:bg-primary/15 transition-colors">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{card.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{card.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, idx) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'rounded-xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'max-w-[85%] bg-primary text-primary-foreground rounded-br-sm'
                    : 'max-w-[90%] bg-card border rounded-bl-sm',
                )}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-table:my-2 prose-th:text-left prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border-b prose-th:border-border prose-td:border-b prose-td:border-border/50 max-w-none text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.chart && <InlineChart chart={msg.chart} />}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <FollowUpCards
                          followUps={msg.followUps}
                          onSelect={sendMessage}
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-xs">{msg.content}</span>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border rounded-xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-2 max-w-2xl mx-auto"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre a produção..."
            className="flex-1 h-10 px-4 text-sm bg-card border rounded-xl outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
