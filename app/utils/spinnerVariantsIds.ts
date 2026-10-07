export const SPINNER_VARIANT_IDS = ["shuffle", "slot", "wheel"] as const;
export type SpinnerVariantId = (typeof SPINNER_VARIANT_IDS)[number];
export const DEFAULT_SPINNER_VARIANT: SpinnerVariantId = "wheel";
