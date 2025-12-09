/**
 * Format a number string with commas (e.g., "1000000" -> "1,000,000")
 */
export function formatNumberWithCommas(value: string): string {
  // Remove any existing commas and non-numeric characters (except decimal point)
  const cleaned = value.replace(/[^\d.]/g, "");

  if (!cleaned) return "";

  // Split by decimal point
  const parts = cleaned.split(".");

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Rejoin with decimal if present
  return parts.join(".");
}

/**
 * Remove commas from a formatted number string (e.g., "1,000,000" -> "1000000")
 */
export function removeCommas(value: string): string {
  return value.replace(/,/g, "");
}

/**
 * Handle number input change - returns the raw value (without commas)
 */
export function parseFormattedNumber(formattedValue: string): string {
  return removeCommas(formattedValue);
}
