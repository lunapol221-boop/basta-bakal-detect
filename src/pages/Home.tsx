import { Link } from "react-router-dom";
import {
  Radio, Upload, ArrowRight, Lock, Camera, Database, Sparkles,
  CheckCircle2, ShieldAlert, AlertTriangle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const features = [
  {
    icon: Radio,
    title: "Real-Time Vision",
    desc: "Continuous webcam analysis with live bounding boxes every 1.5 seconds.",
  },
  {
    icon: Camera,
    title: "Capture & Upload",
    desc: "Snap a photo from your device camera or analyze any uploaded image.",
  },
  {
    icon: Database,
    title: "Persistent Audit",
    desc: "Every flagged event is timestamped, stored, and ready for review.",
  },
  {
    icon: Lock,
    title: "Secure Console",
    desc: "Public scanning, locked dashboard. Only admins access history.",
  },
];

const decisionStates = [
  {
    Icon: CheckCircle2,
    label: "ALLOWED",
    desc: "No deadly weapon detected.",
    accent: "text-success",
    border: "border-success/30",
    bg: "bg-success/5",
  },
  {
    Icon: ShieldAlert,
    label: "NOT ALLOWED",
    desc: "Deadly weapon identified.",
    accent: "text-destructive",
    border: "border-destructive/30",
    bg: "bg-destructive/5",
  },
  {
    Icon: AlertTriangle,
    label: "UNSURE",
    desc: "Low confidence, please retry.",
    accent: "text-warning",
    border: "border-warning/30",
    bg: "bg-warning/5",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-70" aria-hidden />

      {/* HERO */}
      <section className="container relative pt-20 sm:pt-28 pb-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
              Computer Vision · On-Device · Private
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.04em] leading-[0.95] mb-6">
            Detect deadly weapons.
            <br />
            <span className="text-orange-gradient">Instantly.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            BastaBakalBawal is an AI security screening platform that analyzes camera
            feeds, captures, and uploaded images to flag dangerous objects in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="btn-orange rounded-full h-12 px-7 text-[15px] font-semibold">
              <Link to="/scan">
                <Radio className="h-4 w-4" />
                Start Live Scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-7 text-[15px] border-border/80 hover:bg-secondary hover:border-primary/40"
            >
              <Link to="/analyze">
                <Upload className="h-4 w-4" />
                Analyze Image
              </Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex items-center justify-center gap-8 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            <span>Browser-side AI</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">No Cloud Inference</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">Auto-Logged</span>
          </div>
        </div>

        {/* Decision card preview */}
        <div className="mt-20 max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Three Possible Outcomes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {decisionStates.map((s, i) => (
              <div
                key={s.label}
                className={`surface-elevated rounded-2xl p-6 animate-fade-up border ${s.border} ${s.bg}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`h-11 w-11 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center mb-4 ${s.accent}`}>
                  <s.Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <p className={`font-display font-bold text-xl tracking-tight ${s.accent}`}>{s.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container relative py-20">
        <div className="max-w-2xl mb-12 animate-fade-up">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
            // Capabilities
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Built for security teams who need <span className="text-orange-gradient">certainty</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group surface rounded-2xl p-6 hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_hsl(22_100%_55%/0.3)] transition-all animate-fade-up cursor-default"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container relative py-20">
        <div className="surface-elevated rounded-3xl p-8 sm:p-14 noise overflow-hidden relative">
          <div
            className="absolute -top-32 -right-32 h-80 w-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(22 100% 55% / 0.25), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
              // Workflow
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-12 max-w-2xl">
              Three simple steps to a <span className="text-orange-gradient">trusted result</span>.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { n: "01", title: "Capture or Stream", desc: "Open the live camera, snap a photo, or upload any image file." },
                { n: "02", title: "AI Analyzes", desc: "On-device computer vision detects objects and ranks confidence." },
                { n: "03", title: "Decision Issued", desc: "ALLOWED, NOT ALLOWED, or UNSURE — logged automatically." },
              ].map((step) => (
                <div key={step.n} className="relative">
                  <div className="font-mono text-[11px] tracking-[0.2em] text-primary mb-3">
                    STEP {step.n}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container relative py-20">
        <div className="max-w-3xl mx-auto text-center">
          <Logo className="h-14 w-14 mx-auto mb-6 animate-float" />
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Ready to screen?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start a live scan now — no setup, no signup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="btn-orange rounded-full h-12 px-7 font-semibold">
              <Link to="/scan">
                Launch Live Scan <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-7 text-muted-foreground hover:text-foreground">
              <Link to="/admin/login">Admin Console →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
