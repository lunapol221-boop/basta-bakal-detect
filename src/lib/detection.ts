// Decision logic for the AI weapon-detection results returned by the
// `detect-weapon` edge function. The shape lets the rest of the UI
// (StatusBanner, BoundingBoxOverlay, logs) keep working unchanged.

export const WEAPON_LABELS = new Set<string>([
  "knife", "blade", "dagger", "machete", "sword", "katana",
  "axe", "hatchet", "cleaver", "switchblade", "scissors",
  "gun", "handgun", "pistol", "revolver", "rifle", "shotgun",
  "firearm", "submachine gun", "assault rifle",
  "bow", "crossbow", "grenade", "taser", "stun gun", "brass knuckles",
]);

export const FRIENDLY_LABELS: Record<string, string> = {
  knife: "Knife",
  blade: "Blade",
  dagger: "Dagger",
  machete: "Machete",
  sword: "Sword",
  katana: "Katana",
  axe: "Axe",
  hatchet: "Hatchet",
  cleaver: "Cleaver",
  switchblade: "Switchblade",
  scissors: "Scissors",
  gun: "Gun",
  handgun: "Handgun",
  pistol: "Pistol",
  revolver: "Revolver",
  rifle: "Rifle",
  shotgun: "Shotgun",
  firearm: "Firearm",
  grenade: "Grenade",
  taser: "Taser",
};

export const MIN_CONFIDENCE = 0.55;
export const MIN_ANY_DETECTION_CONFIDENCE = 0.35;

export type FinalStatus = "ALLOWED" | "NOT_ALLOWED" | "UNSURE";

export interface DetectionBox {
  label: string;
  score: number;
  // bbox in PIXEL coordinates of the source image. May be omitted if the
  // model didn't return a box.
  bbox: [number, number, number, number];
  isWeapon: boolean;
}

export interface DetectionResult {
  status: FinalStatus;
  detections: DetectionBox[];
  topLabel: string | null;
  topScore: number | null;
  reason?: string | null;
}

// ---------------- AI verdict -> DetectionResult ----------------

export interface AIVerdict {
  status: FinalStatus;
  reason?: string;
  weapons: { label: string; confidence: number; bbox?: number[] }[];
  objects: { label: string; confidence: number }[];
}

/**
 * Convert the edge-function verdict into the DetectionResult shape used by
 * the UI. `sourceWidth` / `sourceHeight` are the pixel dimensions of the
 * original image so we can convert normalized 0-1 bboxes back to pixels.
 */
export function verdictToResult(
  verdict: AIVerdict,
  sourceWidth: number,
  sourceHeight: number
): DetectionResult {
  const weaponBoxes: DetectionBox[] = (verdict.weapons || [])
    .filter((w) => w.confidence >= MIN_ANY_DETECTION_CONFIDENCE)
    .map((w) => ({
      label: (w.label || "weapon").toLowerCase(),
      score: w.confidence,
      bbox: normalizeBbox(w.bbox, sourceWidth, sourceHeight),
      isWeapon: true,
    }));

  const objectBoxes: DetectionBox[] = (verdict.objects || [])
    .filter((o) => o.confidence >= MIN_ANY_DETECTION_CONFIDENCE)
    .map((o) => ({
      label: (o.label || "object").toLowerCase(),
      score: o.confidence,
      bbox: [0, 0, 0, 0] as [number, number, number, number],
      isWeapon: WEAPON_LABELS.has((o.label || "").toLowerCase()),
    }));

  const detections = [...weaponBoxes, ...objectBoxes].sort((a, b) => b.score - a.score);
  const topWeapon = weaponBoxes.sort((a, b) => b.score - a.score)[0];
  const topAny = detections[0];
  const top = topWeapon ?? topAny ?? null;

  return {
    status: verdict.status,
    detections,
    topLabel: top?.label ?? null,
    topScore: top?.score ?? null,
    reason: verdict.reason ?? null,
  };
}

function normalizeBbox(
  bbox: number[] | undefined,
  w: number,
  h: number
): [number, number, number, number] {
  if (!bbox || bbox.length < 4) return [0, 0, 0, 0];
  const [x, y, bw, bh] = bbox;
  // Heuristic: if all values <= 1.5 we assume normalized 0-1 coords.
  const isNormalized = [x, y, bw, bh].every((v) => v >= 0 && v <= 1.5);
  if (isNormalized) {
    return [x * w, y * h, bw * w, bh * h];
  }
  return [x, y, bw, bh];
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
  return (
    FRIENDLY_LABELS[label.toLowerCase()] ??
    label.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
