import { Link } from "react-router-dom";
import { Shield, Radio, Upload, LayoutDashboard, ArrowRight, Lock, Camera, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Radio,
    title: "Real-Time Detection",
    desc: "Stream from your webcam with bounding-box overlays updating every 1.5 seconds.",
  },
  {
    icon: Camera,
    title: "Capture & Upload",
    desc: "Snap a still or analyze any image file with the same vision pipeline.",
  },
  {
    icon: Database,
    title: "Persistent Audit Trail",
    desc: "Every flagged scan is timestamped, logged, and stored for admin review.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    desc: "Public scanning, locked-down dashboard. Only admins see history & snapshots.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 grid-bg opacity-40 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />

      <section className="container relative pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/30 mb-8">
            <span className="h-2 w-2 rounded-full bg-success animate-blink" />
            <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              System Online · AI Vision Active
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient-cyber">BastaBakalBawal</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            AI-powered security screening that detects deadly weapons in real-time
            from camera feeds, captures, and uploaded images.
          </p>
          <p className="text-sm font-mono text-primary/80 tracking-wide mb-10">
            ALLOWED · NOT ALLOWED · UNSURE
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <Link to="/scan">
                <Radio className="h-5 w-5" />
                Start Live Scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/analyze">
                <Upload className="h-5 w-5" />
                Analyze an Image
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-6xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass rounded-xl p-6 hover:border-primary/40 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 max-w-4xl mx-auto glass-strong rounded-2xl p-8 sm:p-12 text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Secure access to detection history, statistics, snapshots, CSV export,
            and manual log management.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin/login">
              <LayoutDashboard className="h-4 w-4" />
              Admin Login
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
