export function useSpinnerVariant() {
  const variant = useCookie<SpinnerVariantId>("spinner-variant", {
    default: () => DEFAULT_SPINNER_VARIANT,
    maxAge: 60 * 60 * 24 * 365
  });

  // Guard against a stale cookie naming a variant that no longer exists
  if (!SPINNER_VARIANT_IDS.includes(variant.value)) {
    variant.value = DEFAULT_SPINNER_VARIANT;
  }

  return variant;
}
