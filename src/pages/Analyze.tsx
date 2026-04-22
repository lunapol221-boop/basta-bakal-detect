import { useRef, useState } from "react";
import { Camera, Upload, Loader2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import StatusBanner from "@/components/StatusBanner";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import { useDetector } from "@/lib/useDetector";
import { evaluateDetections, friendlyLabel, type DetectionResult } from "@/lib/detection";
import { logDetection, uploadSnapshot } from "@/lib/scanLogger";
import { toast } from "sonner";

export default function Analyze() {
  const { model, loading, error } = useDetector();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File, scanType: "upload" | "capture") {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setResult(null);
    setSavedTime(null);
    // Wait for image load before analyzing
    const img = new Image();
    img.onload = async () => {
      setImgEl(img);
      await analyze(img, file, scanType);
    };
    img.src = url;
  }

  async function analyze(img: HTMLImageElement, file: File, scanType: "upload" | "capture") {
    if (!model) return;
    setAnalyzing(true);
    try {
      const preds = await model.detect(img);
      const evald = evaluateDetections(
        preds.map((p) => ({ class: p.class, score: p.score, bbox: p.bbox as [number, number, number, number] }))
      );
      setResult(evald);

      // Save to storage + log
      const upload = await uploadSnapshot(file, scanType);
      await logDetection({
        scanType,
        result: evald,
        imageUrl: upload?.url ?? null,
        notes: scanType === "capture" ? "Camera capture" : "Manual upload",
      });
      setSavedTime(new Date().toLocaleTimeString());

      if (evald.status === "NOT_ALLOWED") {
        toast.error(`Weapon detected: ${friendlyLabel(evald.topLabel)}`);
      } else if (evald.status === "ALLOWED") {
        toast.success("Image cleared.");
      } else {
        toast.warning("Result unclear — please retry with a clearer image.");
      }
    } catch (e: any) {
      console.error("Analyze error:", e);
      toast.error("Analysis failed: " + (e?.message ?? "unknown"));
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
    setImgEl(null);
    setResult(null);
    setSavedTime(null);
  }

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Analyze Image</h1>
          <p className="text-muted-foreground">
            Capture from your camera or upload any image. Result is logged automatically.
          </p>
        </div>

        {error && (
          <div className="glass rounded-xl p-6 border-destructive/40 mb-6">
            <p className="text-destructive font-medium">Failed to load detection model</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="relative aspect-video w-full bg-black/60 rounded-2xl overflow-hidden glass-strong">
              {imgUrl ? (
                <>
                  <img
                    src={imgUrl}
                    alt="Analysis subject"
                    className="w-full h-full object-contain"
                  />
                  {imgEl && result && (
                    <BoundingBoxOverlay
                      detections={result.detections}
                      source={imgEl}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  )}
                  {analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-primary">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="font-mono tracking-widest uppercase text-sm">Analyzing...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6">
                  {loading ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="font-mono text-sm tracking-wider">LOADING AI MODEL...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12" />
                      <p className="font-mono text-sm tracking-wider text-center">
                        UPLOAD OR CAPTURE AN IMAGE TO BEGIN
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !model || analyzing}
                size="lg"
              >
                <Upload className="h-4 w-4" /> Upload Image
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading || !model || analyzing}
                size="lg"
                variant="outline"
              >
                <Camera className="h-4 w-4" /> Capture Photo
              </Button>
              {imgUrl && (
                <Button onClick={reset} variant="ghost">
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, "upload");
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, "capture");
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <StatusBanner
              status={result?.status ?? null}
              topLabel={result?.topLabel ? friendlyLabel(result.topLabel) : null}
              topScore={result?.topScore ?? null}
            />

            {result && (
              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-3">
                  Scan Report
                </h3>
                <div className="space-y-2 text-sm">
                  <Row label="Saved at" value={savedTime ?? "—"} />
                  <Row label="Detections" value={result.detections.length.toString()} />
                  <Row label="Top match" value={result.topLabel ? friendlyLabel(result.topLabel) : "—"} />
                  <Row
                    label="Confidence"
                    value={result.topScore != null ? `${(result.topScore * 100).toFixed(1)}%` : "—"}
                  />
                </div>
              </div>
            )}

            {result && result.detections.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-3">
                  All Objects
                </h3>
                <ul className="space-y-2">
                  {result.detections.map((d, i) => (
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

            {result?.status === "UNSURE" && (
              <Button onClick={reset} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
