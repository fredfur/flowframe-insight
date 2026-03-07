import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Factory, Mail, Lock, Eye, EyeOff, User, Shield, Wrench, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'admin' | 'lideranca' | 'operacao';

const roles: { value: UserRole; label: string; description: string; icon: typeof Shield }[] = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema', icon: Shield },
  { value: 'lideranca', label: 'Liderança', description: 'Dashboards, relatórios e configurações', icon: Users },
  { value: 'operacao', label: 'Operação', description: 'Registro de paradas e linha ao vivo', icon: Wrench },
];

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    // Mock register — replace with real auth
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-card border-r flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Factory className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">FlowVision</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Comece a monitorar sua produção
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Crie sua conta e configure suas linhas de produção em minutos. Tenha controle total sobre OEE, paradas e vazão.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 FlowVision. Todos os direitos reservados.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Factory className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground">FlowVision</span>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Preencha os dados para começar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Perfil de acesso</label>
              <div className="grid gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                      selectedRole === role.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-card hover:bg-accent'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                      selectedRole === role.value ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <role.icon className={cn(
                        'h-4 w-4 transition-colors',
                        selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-medium transition-colors',
                        selectedRole === role.value ? 'text-foreground' : 'text-foreground'
                      )}>
                        {role.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !selectedRole}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Já tem conta?{' '}
            <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
