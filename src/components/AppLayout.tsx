import { ReactNode } from "react";
import { Link, NavLink as RRNavLink, useNavigate } from "react-router-dom";
import { Shield, Camera, Upload, LayoutDashboard, LogOut, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/scan", label: "Live Scan", icon: Radio },
  { to: "/analyze", label: "Analyze Image", icon: Upload },
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl group-hover:bg-primary/50 transition-colors" />
              <Shield className="relative h-7 w-7 text-primary" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight text-gradient-cyber">
                BastaBakalBawal
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                AI Security Screening
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              return (
                <RRNavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/15 text-primary shadow-[0_0_20px_hsl(178_100%_50%/0.2)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </RRNavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/login">Admin Login</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border/60">
          <div className="container flex items-center gap-1 py-2 overflow-x-auto">
            {nav.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              return (
                <RRNavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
                      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </RRNavLink>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 py-6 text-center text-xs font-mono text-muted-foreground">
        <div className="container">
          BASTABAKALBAWAL · AI WEAPON SCREENING · BUILD {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
