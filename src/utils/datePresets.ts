/**
 * Date Preset Utility
 * Calculate date ranges for preset options
 */

/**
 * Calculate date range based on preset
 *
 * @param preset - Preset identifier (1week, 1month, 3months, 6months)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function calculateDateRange(preset: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0]; // Today in YYYY-MM-DD

  if (preset === 'all') {
    return {}; // No date filtering
  }

  let startDate: Date;

  switch (preset) {
    case '1week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;

    case '1month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;

    case '3months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;

    case '6months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;

    default:
      return {}; // Custom or unknown preset
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate
  };
}
