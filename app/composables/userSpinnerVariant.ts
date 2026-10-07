import type { SpinnerVariant } from "~/types/spinner";
import { DEFAULT_SPINNER_VARIANT, SPINNER_LABELS } from "~/types/spinner";

export function useSpinnerVariant() {
  const variant = useCookie<SpinnerVariant>("spinner-variant", {
    default: () => DEFAULT_SPINNER_VARIANT,
    maxAge: 60 * 60 * 24 * 365
  });

  const validVariants = Object.keys(SPINNER_LABELS) as SpinnerVariant[];

  // Guard against a stale cookie naming a variant that no longer exists.
  if (!validVariants.includes(variant.value)) {
    variant.value = DEFAULT_SPINNER_VARIANT;
  }

  return variant;
}
