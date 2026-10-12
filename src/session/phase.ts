// Shared arc boundaries: steady-high start, rising through flow, taper to close.
export const STEADY_END = 0.2;
export const RISING_END = 0.8;

// The 30-minute extension prompt fires partway through the taper phase.
export const EXTENSION_PROMPT_AT = 0.9;

export type Phase = "steady" | "rising" | "taper";

export function currentPhase(elapsedFraction: number): Phase {
  if (elapsedFraction < STEADY_END) return "steady";
  if (elapsedFraction < RISING_END) return "rising";
  return "taper";
}
