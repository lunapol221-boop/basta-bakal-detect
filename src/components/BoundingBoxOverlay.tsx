import { useEffect, useRef } from "react";
import type { DetectionBox } from "@/lib/detection";

interface Props {
  detections: DetectionBox[];
  source: HTMLVideoElement | HTMLImageElement | null;
  className?: string;
}

/**
 * Overlays bounding boxes on top of a media element.
 * The canvas is positioned absolutely; parent must be `relative`.
 */
export default function BoundingBoxOverlay({ detections, source, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;

    let w = 0, h = 0;
    if (source instanceof HTMLVideoElement) {
      w = source.videoWidth;
      h = source.videoHeight;
    } else {
      w = source.naturalWidth;
      h = source.naturalHeight;
    }
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    detections.forEach((d) => {
      const [x, y, bw, bh] = d.bbox;
      const color = d.isWeapon ? "hsl(0 84% 60%)" : "hsl(178 100% 50%)";
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, Math.min(w, h) / 200);
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeRect(x, y, bw, bh);
      ctx.shadowBlur = 0;

      const text = `${d.label.toUpperCase()} ${(d.score * 100).toFixed(0)}%`;
      ctx.font = `bold ${Math.max(14, w / 50)}px 'JetBrains Mono', monospace`;
      const metrics = ctx.measureText(text);
      const padX = 8, padY = 6;
      const textH = Math.max(14, w / 50) + padY;
      ctx.fillStyle = color;
      ctx.fillRect(x, Math.max(0, y - textH), metrics.width + padX * 2, textH);
      ctx.fillStyle = "hsl(222 47% 5%)";
      ctx.fillText(text, x + padX, Math.max(textH - padY / 2, y - padY / 2));
    });
  }, [detections, source]);

  return <canvas ref={canvasRef} className={className} />;
}
