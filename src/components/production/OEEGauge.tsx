import { cn } from '@/lib/utils';

interface OEEGaugeProps {
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function getOEEColor(value: number): string {
  if (value >= 85) return 'text-oee-excellent';
  if (value >= 70) return 'text-oee-good';
  if (value >= 50) return 'text-oee-warning';
  return 'text-oee-critical';
}

export function OEEGauge({ value, label, size = 'md' }: OEEGaugeProps) {
  const sizeClasses = {
    sm: 'h-16 w-16 text-lg',
    md: 'h-24 w-24 text-2xl',
    lg: 'h-32 w-32 text-4xl',
  };

  const radius = size === 'sm' ? 24 : size === 'md' ? 38 : 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = size === 'sm' ? 64 : size === 'md' ? 96 : 128;
  const stroke = size === 'sm' ? 4 : 6;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <svg className="absolute -rotate-90" width={svgSize} height={svgSize}>
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke}
          />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none"
            className={getOEEColor(value).replace('text-', 'stroke-')}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <span className={cn('font-mono font-bold', getOEEColor(value))}>
          {value.toFixed(1)}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}
