import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BarChart3, AlertTriangle, Zap, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: `Baseado nos dados atuais da linha, aqui está o que posso informar:

- **OEE geral**: 69.2% (abaixo da meta de 75%)
- **Principal gargalo**: Inspeção Visual com disponibilidade de 70%
- **Vazão atual**: 380 u/h vs nominal de 500 u/h

Posso detalhar qualquer um desses pontos. O que gostaria de saber?`,

  parada: `Analisando as paradas recentes:

1. **Inspeção Visual** — Falha de sensor (ativa desde 08:30)
2. **Processadora B** — Setup para SKU-204 (25min)
3. **Alimentador** — Falta de material (resolvida)

A parada mais impactante é a da **Inspeção Visual**, que está limitando a vazão da linha inteira. Recomendo priorizar a resolução do sensor de câmera.`,

  oee: `O OEE atual da linha é **69.2%**, composto por:

| Componente | Valor | Meta |
|---|---|---|
| Disponibilidade | 81.4% | 90% |
| Performance | 87.0% | 95% |
| Qualidade | 97.8% | 99% |

O maior gap está na **Disponibilidade** — as paradas não planejadas estão consumindo 18.6% do tempo produtivo. Focar em manutenção preventiva pode recuperar até 8 pontos percentuais.`,

  gargalo: `O gargalo atual da linha é a **Inspeção Visual**:

- **Status**: Falha de sensor de câmera desde 08:30
- **Disponibilidade**: 70% (vs. >90% das demais)
- **Impacto estimado**: -150 u/h na vazão da linha

### Recomendações:
1. Priorizar manutenção corretiva do sensor
2. Avaliar bypass temporário com inspeção manual
3. Verificar estoque de peças sobressalentes`,

  turno: `Comparativo de turnos (últimas 24h):

| Turno | OEE | Disponibilidade | Performance |
|---|---|---|---|
| 1º Turno | 78.5% | 89.2% | 92.1% |
| 2º Turno | 71.3% | 83.4% | 88.7% |
| 3º Turno | 65.1% | 77.8% | 85.2% |

O **1º Turno** lidera em todos os indicadores. A queda progressiva sugere acúmulo de desgaste nos equipamentos ao longo do dia. Recomendo avaliar manutenção preventiva entre turnos.`,
};

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('parada') || lower.includes('stop')) return MOCK_RESPONSES.parada;
  if (lower.includes('oee') || lower.includes('disponibilidade') || lower.includes('performance')) return MOCK_RESPONSES.oee;
  if (lower.includes('gargalo') || lower.includes('bottleneck')) return MOCK_RESPONSES.gargalo;
  if (lower.includes('turno') || lower.includes('shift')) return MOCK_RESPONSES.turno;
  return MOCK_RESPONSES.default;
}

const PROMPT_CARDS = [
  {
    icon: BarChart3,
    title: 'Análise de OEE',
    prompt: 'Qual o OEE atual e como posso melhorá-lo?',
  },
  {
    icon: AlertTriangle,
    title: 'Paradas recentes',
    prompt: 'Resuma as paradas recentes e seus impactos',
  },
  {
    icon: Zap,
    title: 'Gargalo da linha',
    prompt: 'Onde está o gargalo da linha agora?',
  },
  {
    icon: TrendingDown,
    title: 'Comparativo de turnos',
    prompt: 'Compare a performance entre os turnos',
  },
];

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

    const response = getMockResponse(text);
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
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
              {PROMPT_CARDS.map((card) => (
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
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border rounded-bl-sm',
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-table:my-2 max-w-none text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
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
