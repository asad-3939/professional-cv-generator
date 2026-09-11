/**
 * Formats a stored CV date string (e.g. "2024-01", "2020-09", "2024", "Jan 2024", "Present", "")
 * into a human-readable format for resume display (e.g. "Jan 2024", "Present", "2024").
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatCVDate(dateStr: string | undefined | null): string {
  if (!dateStr || typeof dateStr !== "string") {
    return "";
  }

  const trimmed = dateStr.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === "present") return "Present";

  // Match YYYY-MM or YYYY-M
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthNum = parseInt(isoMatch[2], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
    return year;
  }

  // If already matches "Mon YYYY" or "Month YYYY" or plain "YYYY", return as is
  return trimmed;
}

export function formatCVDateRange(startDate: string, endDate: string, isCurrent?: boolean): string {
  const formattedStart = formatCVDate(startDate);
  const formattedEnd = isCurrent ? "Present" : formatCVDate(endDate);

  if (!formattedStart && !formattedEnd) return "";
  if (formattedStart && !formattedEnd) return formattedStart;
  if (!formattedStart && formattedEnd) return formattedEnd;

  return `${formattedStart} – ${formattedEnd}`;
}
