import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import StatusBanner from "@/components/StatusBanner";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import { useDetector } from "@/lib/useDetector";
import { evaluateDetections, friendlyLabel, type DetectionResult } from "@/lib/detection";
import { canvasToBlob, logDetection, uploadSnapshot } from "@/lib/scanLogger";
import { toast } from "sonner";

const DETECT_INTERVAL_MS = 1500;

export default function LiveScan() {
  const { model, loading, error } = useDetector();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastFlagged, setLastFlagged] = useState<string | null>(null);
  const lastSavedRef = useRef<number>(0);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setPaused(false);
    } catch (e) {
      console.error("Camera error:", e);
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setPaused(false);
    setResult(null);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Detection loop
  useEffect(() => {
    if (!streaming || paused || !model || !videoRef.current) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const preds = await model.detect(video);
        const evald = evaluateDetections(
          preds.map((p) => ({ class: p.class, score: p.score, bbox: p.bbox as [number, number, number, number] }))
        );
        if (cancelled) return;
        setResult(evald);
        setScanCount((n) => n + 1);

        // Save flagged frames (debounce: max 1 per 4 seconds)
        if (evald.status === "NOT_ALLOWED" && Date.now() - lastSavedRef.current > 4000) {
          lastSavedRef.current = Date.now();
          await saveFlaggedFrame(video, evald);
        }
      } catch (e) {
        console.error("Detection error:", e);
      }
    };

    tick();
    const id = window.setInterval(tick, DETECT_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [streaming, paused, model]);

  async function saveFlaggedFrame(video: HTMLVideoElement, evald: DetectionResult) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.8);
      const upload = await uploadSnapshot(blob, "live");
      await logDetection({
        scanType: "live",
        result: evald,
        imageUrl: upload?.url ?? null,
        notes: "Auto-saved flagged live frame",
      });
      setLastFlagged(new Date().toLocaleTimeString());
      toast.error(`Weapon detected: ${friendlyLabel(evald.topLabel)}`, {
        description: "Frame saved to detection log.",
      });
    } catch (e) {
      console.error("Save flagged frame error:", e);
    }
  }

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Live Scan</h1>
          <p className="text-muted-foreground">
            Real-time weapon detection from your camera feed. Flagged frames are auto-saved.
          </p>
        </div>

        {error && (
          <div className="glass rounded-xl p-6 border-destructive/40 mb-6">
            <p className="text-destructive font-medium">Failed to load detection model</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div
              ref={containerRef}
              className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden glass-strong border-primary/30"
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {streaming && videoRef.current && result && (
                <BoundingBoxOverlay
                  detections={result.detections}
                  source={videoRef.current}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              {streaming && !paused && (
                <div className="absolute inset-0 scanline pointer-events-none" />
              )}
              {!streaming && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-muted-foreground">
                  {loading ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="font-mono text-sm tracking-wider">LOADING AI MODEL...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-10 w-10" />
                      <p className="font-mono text-sm tracking-wider">CAMERA OFFLINE</p>
                    </>
                  )}
                </div>
              )}
              {streaming && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 backdrop-blur border border-border">
                  <span className={`h-2 w-2 rounded-full ${paused ? "bg-warning" : "bg-destructive animate-blink"}`} />
                  <span className="text-xs font-mono uppercase tracking-widest">
                    {paused ? "Paused" : "Live"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {!streaming ? (
                <Button onClick={startCamera} disabled={loading || !model} size="lg">
                  <Camera className="h-4 w-4" /> Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={() => setPaused((p) => !p)} variant="outline">
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? "Resume" : "Pause"}
                  </Button>
                  <Button onClick={stopCamera} variant="destructive">
                    <CameraOff className="h-4 w-4" /> Stop
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <StatusBanner
              status={result?.status ?? null}
              topLabel={result?.topLabel ? friendlyLabel(result.topLabel) : null}
              topScore={result?.topScore ?? null}
            />

            <div className="glass rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
                Telemetry
              </h3>
              <Stat label="Frames analyzed" value={scanCount.toString()} />
              <Stat label="Cadence" value={`${DETECT_INTERVAL_MS}ms`} />
              <Stat label="Detections" value={(result?.detections.length ?? 0).toString()} />
              <Stat label="Last flagged" value={lastFlagged ?? "—"} />
            </div>

            {result && result.detections.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-3">
                  Detected Objects
                </h3>
                <ul className="space-y-2">
                  {result.detections.slice(0, 6).map((d, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className={d.isWeapon ? "text-destructive font-semibold" : "text-foreground"}>
                        {friendlyLabel(d.label)}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {(d.score * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
