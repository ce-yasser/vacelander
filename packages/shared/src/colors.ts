/** Distinct, readable colors assigned to members who are added without one. */
export const MEMBER_COLOR_PALETTE = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#d97706", // amber
  "#9333ea", // purple
  "#0891b2", // cyan
  "#db2777", // pink
  "#65a30d", // lime
  "#ea580c", // orange
  "#4f46e5", // indigo
  "#0d9488", // teal
  "#a21caf", // fuchsia
] as const;

/**
 * Picks the first palette color nobody uses yet. When every color is taken,
 * cycles through the palette so the choice stays deterministic.
 */
export function pickMemberColor(usedColors: readonly string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  const free = MEMBER_COLOR_PALETTE.find((c) => !used.has(c));
  return free ?? MEMBER_COLOR_PALETTE[usedColors.length % MEMBER_COLOR_PALETTE.length]!;
}

/** Black or white, whichever reads better on top of `hex`. */
export function readableTextColor(hex: string): "#000000" | "#ffffff" {
  const value = hex.replace("#", "");
  const channel = (offset: number) => {
    const c = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.4 ? "#000000" : "#ffffff";
}
