import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

export function loadDetector() {
  if (!modelPromise) {
    modelPromise = cocoSsd.load({ base: "lite_mobilenet_v2" });
  }
  return modelPromise;
}

export function useDetector() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadDetector()
      .then((m) => {
        if (mounted.current) {
          setModel(m);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error("Failed to load model:", e);
        if (mounted.current) {
          setError(e?.message ?? "Failed to load detection model");
          setLoading(false);
        }
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  return { model, loading, error };
}
