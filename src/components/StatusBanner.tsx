import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinalStatus } from "@/lib/detection";
import { statusLabel } from "@/lib/detection";

interface Props {
  status: FinalStatus | null;
  topLabel?: string | null;
  topScore?: number | null;
  className?: string;
}

export default function StatusBanner({ status, topLabel, topScore, className }: Props) {
  if (!status) {
    return (
      <div className={cn("glass rounded-xl p-6 text-center", className)}>
        <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
          AWAITING SCAN
        </p>
      </div>
    );
  }

  const config = {
    ALLOWED: {
      icon: CheckCircle2,
      label: statusLabel("ALLOWED"),
      bg: "bg-success/10 border-success/40",
      text: "text-success",
      glow: "glow-success",
      gradient: "var(--gradient-success)",
    },
    NOT_ALLOWED: {
      icon: ShieldAlert,
      label: statusLabel("NOT_ALLOWED"),
      bg: "bg-destructive/10 border-destructive/50",
      text: "text-destructive",
      glow: "glow-danger animate-pulse-glow",
      gradient: "var(--gradient-danger)",
    },
    UNSURE: {
      icon: AlertTriangle,
      label: statusLabel("UNSURE"),
      bg: "bg-warning/10 border-warning/40",
      text: "text-warning",
      glow: "glow-warning",
      gradient: "var(--gradient-warning)",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-6 flex items-center gap-5 animate-fade-up",
        config.bg,
        config.glow,
        className
      )}
      style={{ background: config.gradient }}
    >
      <Icon className={cn("h-12 w-12 shrink-0", config.text)} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-2xl sm:text-3xl font-bold tracking-tight", config.text)}>
          {config.label}
        </p>
        {topLabel && (
          <p className="text-sm font-mono text-muted-foreground mt-1 truncate">
            {topLabel.toUpperCase()}
            {typeof topScore === "number" && (
              <span className="ml-2 text-foreground/70">
                · {(topScore * 100).toFixed(1)}%
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
