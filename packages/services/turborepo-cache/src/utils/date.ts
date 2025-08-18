export function isDateOlderThan(date: Date, hours: number): boolean {
  const dateMs = date.getTime();
  if (Number.isNaN(dateMs)) {
    return false;
  }
  // Fail-safe: do not treat negative thresholds as "older than"
  if (hours <= 0) {
    return false;
  }
  const diffMs = Date.now() - dateMs;
  // Future dates are not "older than"
  if (diffMs < 0) {
    return false;
  }
  const MS_PER_HOUR = 1000 * 60 * 60;
  const thresholdMs = hours * MS_PER_HOUR;
  return diffMs >= thresholdMs;
}
