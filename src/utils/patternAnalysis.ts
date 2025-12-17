/**
 * Pattern Analysis Utility
 *
 * Detects intra-day time slot pattern similarities:
 * - SAME-DIRECTION: Both slots move in the same direction (UP/UP or DOWN/DOWN)
 * - OPPOSITE-DIRECTION: Slots move in opposite directions (UP/DOWN or DOWN/UP)
 *
 * Used for identifying trading patterns and correlations within the same day.
 */

export type SlotDirection = 'UP' | 'DOWN' | 'NEUTRAL';

/**
 * Signature of a single trading day
 * Maps time slot (HH:MM) to its direction
 */
export interface DaySignature {
  date: string; // YYYY-MM-DD
  slots: Map<string, SlotDirection>; // "09:30" -> "UP"
}

/**
 * Relationship between two time slots
 */
export interface PatternRelationship {
  slotA: string;          // "09:30"
  slotB: string;          // "15:00"
  relationship: 'SAME' | 'OPPOSITE';
  confidence: number;     // 0-100 percentage
  sampleSize: number;     // Number of days analyzed
  sameCount: number;      // Days where both moved same direction
  oppositeCount: number;  // Days where they moved opposite
}

export interface PatternAnalysisConfig {
  minSampleSize: number;      // Minimum days required (default: 30)
  minConfidence: number;      // Minimum confidence % (default: 60)
  noiseThreshold: number;     // Same as main analysis
}

/**
 * Build day signatures from OHLC data
 * Groups candles by day and classifies each 15-min slot
 */
export function buildDaySignatures(
  rows: Array<{
    torontoDate: Date;
    open: number;
    close: number;
  }>,
  noiseThreshold: number
): DaySignature[] {
  // Group by date
  const dayMap = new Map<string, Map<string, SlotDirection>>();

  for (const row of rows) {
    const date = row.torontoDate.toISOString().split('T')[0];
    const timeSlot = row.torontoDate.toTimeString().slice(0, 5); // "HH:MM"

    // Classify direction
    const changePercent = ((row.close - row.open) / row.open) * 100;
    let direction: SlotDirection = 'NEUTRAL';

    if (Math.abs(changePercent) >= noiseThreshold) {
      direction = changePercent > 0 ? 'UP' : 'DOWN';
    }

    // Store in day map
    if (!dayMap.has(date)) {
      dayMap.set(date, new Map());
    }
    dayMap.get(date)!.set(timeSlot, direction);
  }

  // Convert to array of DaySignatures
  const signatures: DaySignature[] = [];
  for (const [date, slots] of dayMap.entries()) {
    signatures.push({ date, slots });
  }

  return signatures.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate pairwise pattern relationships
 * For each pair of time slots, determine if they tend to move:
 * - SAME direction (both UP or both DOWN)
 * - OPPOSITE direction (one UP, other DOWN)
 */
export function calculatePairwisePatterns(
  signatures: DaySignature[],
  config: PatternAnalysisConfig
): PatternRelationship[] {
  // Collect all unique time slots
  const allSlots = new Set<string>();
  for (const sig of signatures) {
    for (const slot of sig.slots.keys()) {
      allSlots.add(slot);
    }
  }

  const slotArray = Array.from(allSlots).sort();
  const relationships: PatternRelationship[] = [];

  // Calculate pairwise relationships
  // Only compare slotA < slotB (avoid duplicates and self-comparison)
  for (let i = 0; i < slotArray.length; i++) {
    for (let j = i + 1; j < slotArray.length; j++) {
      const slotA = slotArray[i];
      const slotB = slotArray[j];

      // Count occurrences
      let sameCount = 0;      // Both UP or both DOWN
      let oppositeCount = 0;  // One UP, other DOWN
      let validDays = 0;      // Days where both slots exist and are not NEUTRAL

      for (const sig of signatures) {
        const dirA = sig.slots.get(slotA);
        const dirB = sig.slots.get(slotB);

        // Skip if either slot is missing or NEUTRAL
        if (!dirA || !dirB || dirA === 'NEUTRAL' || dirB === 'NEUTRAL') {
          continue;
        }

        validDays++;

        if (dirA === dirB) {
          sameCount++;
        } else {
          oppositeCount++;
        }
      }

      // Skip if not enough valid days
      if (validDays < config.minSampleSize) {
        continue;
      }

      // Calculate confidences
      const sameConfidence = (sameCount / validDays) * 100;
      const oppositeConfidence = (oppositeCount / validDays) * 100;

      // Determine dominant relationship
      if (sameConfidence >= config.minConfidence && sameConfidence > oppositeConfidence) {
        relationships.push({
          slotA,
          slotB,
          relationship: 'SAME',
          confidence: Math.round(sameConfidence * 10) / 10,
          sampleSize: validDays,
          sameCount,
          oppositeCount
        });
      } else if (oppositeConfidence >= config.minConfidence && oppositeConfidence > sameConfidence) {
        relationships.push({
          slotA,
          slotB,
          relationship: 'OPPOSITE',
          confidence: Math.round(oppositeConfidence * 10) / 10,
          sampleSize: validDays,
          sameCount,
          oppositeCount
        });
      }
    }
  }

  // Sort by confidence descending
  return relationships.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Filter patterns by minimum confidence and sample size
 */
export function filterPatterns(
  patterns: PatternRelationship[],
  minConfidence: number,
  minSampleSize: number
): PatternRelationship[] {
  return patterns.filter(
    p => p.confidence >= minConfidence && p.sampleSize >= minSampleSize
  );
}

/**
 * Get all patterns involving a specific time slot
 * Useful for Today Mode to find related slots
 */
export function getPatternsForSlot(
  patterns: PatternRelationship[],
  targetSlot: string
): PatternRelationship[] {
  return patterns.filter(
    p => p.slotA === targetSlot || p.slotB === targetSlot
  );
}

/**
 * Get the relationship between two specific slots
 */
export function getRelationship(
  patterns: PatternRelationship[],
  slotA: string,
  slotB: string
): PatternRelationship | null {
  // Check both directions (slotA-slotB and slotB-slotA)
  return patterns.find(
    p => (p.slotA === slotA && p.slotB === slotB) ||
         (p.slotA === slotB && p.slotB === slotA)
  ) || null;
}
