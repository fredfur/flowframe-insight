import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronRight, Lightbulb, TrendingDown, AlertTriangle, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Types ───

export interface AIInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  summary: string;
  detail?: string;
  metric?: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Mock Insights ───

export const MOCK_DASHBOARD_INSIGHTS: AIInsight[] = [
  {
    id: 'di-1', type: 'warning', timestamp: new Date(),
    title: 'OEE em queda na Linha 01',
    summary: 'O OEE caiu 8.2% nas últimas 4 horas, puxado por disponibilidade. A Processadora B acumula 3 paradas de manutenção não planejada.',
    detail: 'Recomendação: avaliar manutenção preventiva na Processadora B. Historicamente, esse equipamento apresenta falhas recorrentes após 120h de operação contínua.',
    metric: '-8.2%',
  },
  {
    id: 'di-2', type: 'opportunity', timestamp: new Date(),
    title: 'Setup pode ser otimizado',
    summary: 'O tempo médio de setup aumentou 40% nesta semana. SKU-204 leva 25min vs. média de 15min.',
    detail: 'Sugestão: padronizar procedimento SMED para troca do SKU-204. Times do 2º turno apresentam tempo 30% menor — considerar treinamento cruzado.',
    metric: '+40%',
  },
  {
    id: 'di-3', type: 'info', timestamp: new Date(),
    title: 'Melhor turno: 1º Turno',
    summary: 'O 1º turno mantém OEE 12% acima da média geral. Performance e qualidade consistentes.',
  },
];

export const MOCK_LINELIVE_INSIGHTS: AIInsight[] = [
  {
    id: 'li-1', type: 'warning', timestamp: new Date(),
    title: 'Gargalo detectado na Inspeção Visual',
    summary: 'A Inspeção Visual opera a 70% de disponibilidade, limitando a vazão da linha inteira. As demais máquinas estão acima de 90%.',
    detail: 'A máquina está em falha desde 08:30. Sensor de câmera com problema. Impacto estimado: -150 u/h na vazão da linha.',
    metric: '70%',
  },
  {
    id: 'li-2', type: 'opportunity', timestamp: new Date(),
    title: 'Acúmulo crescente pré-Embaladora',
    summary: 'O buffer entre Processadora B e Embaladora está a 95% de capacidade. Risco de parada por acúmulo nos próximos 10min.',
    detail: 'A Embaladora está a 92% de disponibilidade mas com velocidade 8% abaixo do nominal. Ajustar velocidade pode prevenir overflow.',
    metric: '95%',
  },
];

const MOCK_CHAT_RESPONSES: Record<string, string> = {
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
};

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('parada') || lower.includes('stop')) return MOCK_CHAT_RESPONSES.parada;
  if (lower.includes('oee') || lower.includes('disponibilidade') || lower.includes('performance')) return MOCK_CHAT_RESPONSES.oee;
  return MOCK_CHAT_RESPONSES.default;
}

// ─── Insight Chip Component (minimal inline pill with tooltip) ───

const insightIcons = {
  warning: AlertTriangle,
  opportunity: Lightbulb,
  info: TrendingDown,
};

const chipStyles = {
  warning: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
  opportunity: 'bg-status-running/10 text-status-running hover:bg-status-running/15',
  info: 'bg-primary/10 text-primary hover:bg-primary/15',
};

export function AIInsightChip({
  insight,
  onAskAI,
}: {
  insight: AIInsight;
  onAskAI?: (context: string) => void;
}) {
  const Icon = insightIcons[insight.type];
  const [showTooltip, setShowTooltip] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-flex" ref={chipRef}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => onAskAI?.(`Sobre "${insight.title}": ${insight.summary}`)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer',
          chipStyles[insight.type],
        )}
      >
        <Icon className="h-2.5 w-2.5" />
        <span className="truncate max-w-[140px]">{insight.title}</span>
        {insight.metric && (
          <span className="font-semibold tabular-nums">{insight.metric}</span>
        )}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-lg border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150">
          <p className="text-[11px] font-medium mb-1">{insight.title}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{insight.summary}</p>
          {onAskAI && (
            <p className="text-[9px] text-primary mt-1.5 flex items-center gap-1">
              <Sparkles className="h-2 w-2" /> Clique para perguntar à IA
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AIInsightChips({
  insights,
  onAskAI,
}: {
  insights: AIInsight[];
  onAskAI?: (context: string) => void;
}) {
  if (insights.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0 shrink">
      <div className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 shrink-0">
        <Sparkles className="h-2.5 w-2.5 text-primary" />
      </div>
      {insights.map((insight) => (
        <AIInsightChip key={insight.id} insight={insight} onAskAI={onAskAI} />
      ))}
    </div>
  );
}

// ─── Floating Chat Assistant ───

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response with typing delay
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

  // Public method to inject context from insight cards
  const askFromContext = (context: string) => {
    setIsOpen(true);
    setTimeout(() => sendMessage(context), 100);
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] max-h-[520px] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Assistente IA</p>
                <p className="text-[9px] text-muted-foreground">Análise de produção em tempo real</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[280px] max-h-[360px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">Como posso ajudar?</p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                    Pergunte sobre OEE, paradas, gargalos ou tendências da produção.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {['Qual o OEE atual?', 'Resumo das paradas', 'Onde está o gargalo?'].map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[10px] px-2.5 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}>
                  <ChatMessageContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre a produção..."
                className="flex-1 h-8 px-3 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
                disabled={isTyping}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Simple markdown-like renderer (no dependency needed for mock)
function ChatMessageContent({ content }: { content: string }) {
  // Simple rendering: bold, tables, lists
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('|') && line.includes('|')) {
          // Table row
          const cells = line.split('|').filter(c => c.trim());
          if (cells.every(c => c.trim().match(/^-+$/))) return null; // separator
          return (
            <div key={i} className="flex gap-2 text-[10px] tabular-nums">
              {cells.map((cell, j) => (
                <span key={j} className={cn('flex-1', j === 0 && 'font-medium')}>
                  {renderInline(cell.trim())}
                </span>
              ))}
            </div>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          return <p key={i} className="pl-2">{renderInline(line)}</p>;
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="pl-2">• {renderInline(line.slice(2))}</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ─── Export a hook-like function for parent components to trigger chat ───

let _chatRef: { askFromContext: (ctx: string) => void } | null = null;

export function useChatAssistant() {
  return {
    askAI: (context: string) => {
      _chatRef?.askFromContext(context);
    },
  };
}

export function AIChatAssistantWithRef() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
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
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`, role: 'assistant', content: response, timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  useEffect(() => {
    _chatRef = {
      askFromContext: (ctx: string) => {
        setIsOpen(true);
        setTimeout(() => sendMessage(ctx), 150);
      },
    };
    return () => { _chatRef = null; };
  }, []);

  return <AIChatPanel
    isOpen={isOpen}
    setIsOpen={setIsOpen}
    messages={messages}
    input={input}
    setInput={setInput}
    isTyping={isTyping}
    sendMessage={sendMessage}
    scrollRef={scrollRef}
    inputRef={inputRef}
  />;
}

function AIChatPanel({
  isOpen, setIsOpen, messages, input, setInput, isTyping, sendMessage, scrollRef, inputRef,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  sendMessage: (text: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] max-h-[520px] rounded-xl border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Assistente IA</p>
                <p className="text-[9px] text-muted-foreground">Análise de produção em tempo real</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[280px] max-h-[360px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">Como posso ajudar?</p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                    Pergunte sobre OEE, paradas, gargalos ou tendências.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {['Qual o OEE atual?', 'Resumo das paradas', 'Onde está o gargalo?'].map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[10px] px-2.5 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}>
                  <ChatMessageContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-3 py-2.5">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre a produção..."
                className="flex-1 h-8 px-3 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!input.trim() || isTyping}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
