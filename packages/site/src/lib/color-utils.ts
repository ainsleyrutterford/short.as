import { hexToHsva, hsvaToHexa } from "@uiw/color-convert";

export { hexToHsva, hsvaToHexa };

export interface HSVA {
  h: number;
  s: number;
  v: number;
  a: number;
}

/**
 * Normalizes a hex color input to a standard format with # prefix. Handles 6 and 8 character
 * hex codes (with or without `#`).
 *
 * Returns `undefined` for invalid inputs.
 */
export const normalizeHex = (input: string) => {
  const trimmed = input.trim();
  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;

  // Only 0-9, a-f, A-F allowed
  if (!/^[0-9a-fA-F]+$/.test(hex)) return undefined;

  if (hex.length === 6 || hex.length === 8) return `#${hex.toLowerCase()}`;

  return undefined;
};

export const alphaToPercentage = (alpha: number) => Math.round(alpha * 100).toString();

/**
 * Converts a percentage string (0-100) to an alpha value (0-1).
 * Returns `undefined` for invalid inputs (non-numeric, negative, or > 100).
 */
export const percentageToAlpha = (percentage: string) => {
  const trimmed = percentage.trim();
  if (trimmed === "") return undefined;

  // Validate numeric format (integers and decimals only)
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return undefined;

  const value = parseFloat(trimmed);
  if (isNaN(value) || value < 0 || value > 100) return undefined;

  return value / 100;
};

/** Low brightness (v < 50) is dark, but saturated colors (s > 50) appear dark even at moderate brightness */
export const isDark = (hsva: HSVA) => hsva.v < 50 || (hsva.s > 50 && hsva.v < 70);
