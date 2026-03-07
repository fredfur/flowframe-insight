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
    sm: 'h-14 w-14 text-sm',
    md: 'h-20 w-20 text-xl',
    lg: 'h-28 w-28 text-3xl',
  };

  const radius = size === 'sm' ? 22 : size === 'md' ? 34 : 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = size === 'sm' ? 56 : size === 'md' ? 80 : 112;
  const stroke = size === 'sm' ? 3 : 4;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <svg className="absolute -rotate-90" width={svgSize} height={svgSize}>
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke="hsl(var(--border))" strokeWidth={stroke}
          />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none"
            className={getOEEColor(value).replace('text-', 'stroke-')}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <span className={cn('font-semibold tabular-nums', getOEEColor(value))}>
          {value.toFixed(1)}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
