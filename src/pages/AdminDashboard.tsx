import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, Download, Trash2,
  RefreshCw, Search, Loader2, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyLabel, statusLabel } from "@/lib/detection";
import { cn } from "@/lib/utils";

interface LogRow {
  id: string;
  created_at: string;
  scan_type: "live" | "capture" | "upload";
  final_status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
  detected_labels: string[];
  confidence_scores: number[];
  image_url: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("detection_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load logs: " + error.message);
    } else {
      setLogs((data ?? []) as LogRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== "all" && l.final_status !== statusFilter) return false;
      if (dateFilter) {
        const d = format(new Date(l.created_at), "yyyy-MM-dd");
        if (d !== dateFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const inLabels = l.detected_labels.some((lab) => lab.toLowerCase().includes(q));
        const inNotes = (l.notes ?? "").toLowerCase().includes(q);
        const inType = l.scan_type.includes(q);
        if (!inLabels && !inNotes && !inType) return false;
      }
      return true;
    });
  }, [logs, search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const flagged = logs.filter((l) => l.final_status === "NOT_ALLOWED").length;
    const allowed = logs.filter((l) => l.final_status === "ALLOWED").length;
    const unsure = logs.filter((l) => l.final_status === "UNSURE").length;
    return { total, flagged, allowed, unsure };
  }, [logs]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("detection_logs").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success("Log deleted.");
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
    setDeleteId(null);
  }

  function exportCSV() {
    if (filtered.length === 0) {
      toast.error("No logs to export.");
      return;
    }
    const header = ["id", "created_at", "scan_type", "final_status", "detected_labels", "confidence_scores", "image_url", "notes"];
    const rows = filtered.map((l) => [
      l.id,
      l.created_at,
      l.scan_type,
      l.final_status,
      l.detected_labels.join("|"),
      l.confidence_scores.join("|"),
      l.image_url ?? "",
      (l.notes ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bastabakalbawal-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} rows.`);
  }

  return (
    <AppLayout>
      <div className="container py-8 max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor scans, review flagged events, and manage detection history.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </Button>
            <Button onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Shield} label="Total Scans" value={stats.total} tint="primary" />
          <StatCard icon={ShieldAlert} label="Not Allowed" value={stats.flagged} tint="destructive" />
          <StatCard icon={ShieldCheck} label="Allowed" value={stats.allowed} tint="success" />
          <StatCard icon={AlertTriangle} label="Unsure" value={stats.unsure} tint="warning" />
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search labels, notes, scan type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="NOT_ALLOWED">Not Allowed</SelectItem>
              <SelectItem value="ALLOWED">Allowed</SelectItem>
              <SelectItem value="UNSURE">Unsure</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[170px]"
          />
          {(search || statusFilter !== "all" || dateFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Detections</th>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                      {logs.length === 0 ? "NO SCANS RECORDED YET" : "NO MATCHING RESULTS"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border/40 hover:bg-card/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {format(new Date(l.created_at), "MMM d, HH:mm:ss")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">
                          {l.scan_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={l.final_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {l.detected_labels.slice(0, 3).map((lab, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded bg-secondary font-mono"
                              title={`${(l.confidence_scores[i] ?? 0) * 100}%`}
                            >
                              {friendlyLabel(lab)} {l.confidence_scores[i] ? `${(l.confidence_scores[i] * 100).toFixed(0)}%` : ""}
                            </span>
                          ))}
                          {l.detected_labels.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {l.detected_labels.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{l.detected_labels.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {l.image_url ? (
                          <button
                            onClick={() => setPreviewUrl(l.image_url)}
                            className="h-10 w-14 rounded overflow-hidden border border-border hover:border-primary transition-colors"
                          >
                            <img src={l.image_url} alt="snapshot" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(l.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image preview */}
      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Snapshot Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="snapshot" className="w-full rounded-lg border border-border" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the detection record. The stored snapshot
              file will remain in storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon, label, value, tint,
}: {
  icon: any; label: string; value: number;
  tint: "primary" | "destructive" | "success" | "warning";
}) {
  const tintClass = {
    primary: "text-primary bg-primary/10 border-primary/30",
    destructive: "text-destructive bg-destructive/10 border-destructive/30",
    success: "text-success bg-success/10 border-success/30",
    warning: "text-warning bg-warning/10 border-warning/30",
  }[tint];
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center border", tintClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-3xl font-bold font-mono">{value}</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE" }) {
  const cfg = {
    ALLOWED: "bg-success/15 text-success border-success/40",
    NOT_ALLOWED: "bg-destructive/15 text-destructive border-destructive/40",
    UNSURE: "bg-warning/15 text-warning border-warning/40",
  }[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold border", cfg)}>
      {statusLabel(status)}
    </span>
  );
}
