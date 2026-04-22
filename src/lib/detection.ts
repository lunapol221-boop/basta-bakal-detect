// COCO-SSD doesn't natively detect most weapons (only "knife" + arguably "scissors").
// To make this app practically useful, we treat these labels as deadly weapons:
// "knife", "scissors". Everything else is treated as ALLOWED (safe object).
// Confidence below MIN_CONFIDENCE -> UNSURE.

export const WEAPON_LABELS = new Set<string>([
  "knife",
  "scissors", // sharp blade-like — flagged as cautionary deadly
]);

// Friendly label for unknown / model-name passthrough
export const FRIENDLY_LABELS: Record<string, string> = {
  knife: "Knife / Blade",
  scissors: "Scissors / Sharp Object",
};

export const MIN_CONFIDENCE = 0.55; // below this we say UNSURE
export const MIN_ANY_DETECTION_CONFIDENCE = 0.45; // anything below this is treated as nothing detected

export type FinalStatus = "ALLOWED" | "NOT_ALLOWED" | "UNSURE";

export interface DetectionBox {
  label: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  isWeapon: boolean;
}

export interface DetectionResult {
  status: FinalStatus;
  detections: DetectionBox[];
  topLabel: string | null;
  topScore: number | null;
}

export function evaluateDetections(
  predictions: { class: string; score: number; bbox: [number, number, number, number] }[]
): DetectionResult {
  const detections: DetectionBox[] = predictions
    .filter((p) => p.score >= MIN_ANY_DETECTION_CONFIDENCE)
    .map((p) => ({
      label: p.class,
      score: p.score,
      bbox: p.bbox,
      isWeapon: WEAPON_LABELS.has(p.class.toLowerCase()),
    }));

  const weapons = detections.filter((d) => d.isWeapon);
  const top = detections.sort((a, b) => b.score - a.score)[0] ?? null;

  // Decision logic
  // 1. Any weapon detected with high enough confidence -> NOT_ALLOWED
  const confidentWeapon = weapons.find((w) => w.score >= MIN_CONFIDENCE);
  if (confidentWeapon) {
    return {
      status: "NOT_ALLOWED",
      detections,
      topLabel: confidentWeapon.label,
      topScore: confidentWeapon.score,
    };
  }

  // 2. Weapon detected but low confidence -> UNSURE
  if (weapons.length > 0) {
    return {
      status: "UNSURE",
      detections,
      topLabel: weapons[0].label,
      topScore: weapons[0].score,
    };
  }

  // 3. Some object detected with decent confidence and not a weapon -> ALLOWED
  if (top && top.score >= MIN_CONFIDENCE) {
    return {
      status: "ALLOWED",
      detections,
      topLabel: top.label,
      topScore: top.score,
    };
  }

  // 4. Nothing confident at all -> UNSURE
  return {
    status: "UNSURE",
    detections,
    topLabel: top?.label ?? null,
    topScore: top?.score ?? null,
  };
}

export function statusLabel(status: FinalStatus) {
  switch (status) {
    case "ALLOWED":
      return "ALLOWED";
    case "NOT_ALLOWED":
      return "NOT ALLOWED";
    case "UNSURE":
      return "UNSURE – PLEASE RETRY";
  }
}

export function friendlyLabel(label: string | null) {
  if (!label) return "Unknown";
  return FRIENDLY_LABELS[label.toLowerCase()] ?? label.replace(/\b\w/g, (c) => c.toUpperCase());
}
