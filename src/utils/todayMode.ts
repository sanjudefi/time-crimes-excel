/**
 * Today Mode Utility
 *
 * Analyzes today's completed candles and projects the remaining time slots
 * based on historical pattern relationships.
 *
 * Creates a "Daily Trading Playbook" showing:
 * - Which time slots are likely to be UP/DOWN
 * - Confidence scores based on pattern analysis
 * - Reasoning (which earlier slot triggered the pattern)
 */

import { PatternRelationship, SlotDirection } from './patternAnalysis';

export type TradeBias = 'LONG' | 'SHORT' | 'AVOID';
export type BiasStrength = 'STRONG' | 'WEAK' | 'NONE';

/**
 * Today's completed candle with classification
 */
export interface TodayCandle {
  timeSlot: string;        // "09:30"
  direction: SlotDirection; // UP/DOWN/NEUTRAL
  changePercent: number;   // Actual % change
}

/**
 * Projection for a future time slot
 */
export interface TodayProjection {
  timeSlot: string;          // "15:00"
  expectedDirection: SlotDirection; // UP/DOWN/NEUTRAL
  bias: TradeBias;           // LONG/SHORT/AVOID
  strength: BiasStrength;    // STRONG/WEAK/NONE
  confidence: number;        // 0-100 percentage
  sampleSize: number;        // Number of historical days
  reason: string;            // "Follows 09:30 UP pattern (SAME, 68%)"
  triggerSlot: string;       // "09:30" (which slot triggered this)
}

/**
 * Today's overall analysis
 */
export interface TodayAnalysis {
  date: string;                    // YYYY-MM-DD
  completedCandles: TodayCandle[]; // Already closed slots
  projections: TodayProjection[];  // Future slot predictions
  morningBias: SlotDirection;      // Overall morning trend
  morningStrength: number;         // 0-100 confidence in morning bias
}

export interface TodayModeConfig {
  strongBiasThreshold: number;  // ≥65% default
  weakBiasThreshold: number;    // ≥55% default
  currentTime: Date;             // Toronto time "now"
}

/**
 * Analyze today's completed candles
 * Determines what has already happened today
 */
export function analyzeTodayCandles(
  rows: Array<{
    torontoDate: Date;
    open: number;
    close: number;
  }>,
  noiseThreshold: number,
  todayDate: string, // YYYY-MM-DD
  currentTime: Date   // Toronto time
): TodayCandle[] {
  const completedCandles: TodayCandle[] = [];

  for (const row of rows) {
    const rowDate = row.torontoDate.toISOString().split('T')[0];

    // Only process today's data
    if (rowDate !== todayDate) {
      continue;
    }

    // Only include candles that have already closed
    if (row.torontoDate >= currentTime) {
      continue;
    }

    const timeSlot = row.torontoDate.toTimeString().slice(0, 5); // "HH:MM"
    const changePercent = ((row.close - row.open) / row.open) * 100;

    let direction: SlotDirection = 'NEUTRAL';
    if (Math.abs(changePercent) >= noiseThreshold) {
      direction = changePercent > 0 ? 'UP' : 'DOWN';
    }

    completedCandles.push({
      timeSlot,
      direction,
      changePercent: Math.round(changePercent * 100) / 100
    });
  }

  return completedCandles.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
}

/**
 * Calculate morning bias from completed candles
 * Looks at early morning slots (before 12:00) to determine overall trend
 */
export function calculateMorningBias(
  completedCandles: TodayCandle[]
): { bias: SlotDirection; strength: number } {
  const morningCandles = completedCandles.filter(c => c.timeSlot < '12:00');

  if (morningCandles.length === 0) {
    return { bias: 'NEUTRAL', strength: 0 };
  }

  let upCount = 0;
  let downCount = 0;

  for (const candle of morningCandles) {
    if (candle.direction === 'UP') upCount++;
    if (candle.direction === 'DOWN') downCount++;
  }

  const total = upCount + downCount;
  if (total === 0) {
    return { bias: 'NEUTRAL', strength: 0 };
  }

  const upPercent = (upCount / total) * 100;
  const downPercent = (downCount / total) * 100;

  if (upPercent > downPercent) {
    return { bias: 'UP', strength: Math.round(upPercent) };
  } else if (downPercent > upPercent) {
    return { bias: 'DOWN', strength: Math.round(downPercent) };
  } else {
    return { bias: 'NEUTRAL', strength: 50 };
  }
}

/**
 * Project remaining time slots based on pattern relationships
 *
 * For each completed slot that moved UP or DOWN:
 * - Find all pattern relationships involving that slot
 * - Project future slots based on those patterns
 * - Score confidence based on pattern strength
 */
export function projectRemainingSlots(
  completedCandles: TodayCandle[],
  patterns: PatternRelationship[],
  allPossibleSlots: string[], // All 15-min slots in a day
  config: TodayModeConfig
): TodayProjection[] {
  const projections = new Map<string, TodayProjection>();

  // Get list of completed slot times
  const completedSlots = new Set(completedCandles.map(c => c.timeSlot));

  // Get future slots (not yet completed)
  const futureSlots = allPossibleSlots.filter(slot => !completedSlots.has(slot));

  // For each completed candle that has a clear direction
  for (const candle of completedCandles) {
    if (candle.direction === 'NEUTRAL') {
      continue; // Skip neutral candles
    }

    // Find all patterns involving this slot
    const relatedPatterns = patterns.filter(
      p => p.slotA === candle.timeSlot || p.slotB === candle.timeSlot
    );

    for (const pattern of relatedPatterns) {
      // Determine which slot is the target (future slot)
      const targetSlot = pattern.slotA === candle.timeSlot ? pattern.slotB : pattern.slotA;

      // Skip if target is not a future slot
      if (!futureSlots.includes(targetSlot)) {
        continue;
      }

      // Determine expected direction based on relationship
      let expectedDirection: SlotDirection;
      if (pattern.relationship === 'SAME') {
        expectedDirection = candle.direction; // Same as trigger
      } else {
        // OPPOSITE
        expectedDirection = candle.direction === 'UP' ? 'DOWN' : 'UP';
      }

      // Calculate bias
      const bias: TradeBias = expectedDirection === 'UP' ? 'LONG' :
                               expectedDirection === 'DOWN' ? 'SHORT' : 'AVOID';

      // Determine strength
      let strength: BiasStrength;
      if (pattern.confidence >= config.strongBiasThreshold) {
        strength = 'STRONG';
      } else if (pattern.confidence >= config.weakBiasThreshold) {
        strength = 'WEAK';
      } else {
        strength = 'NONE';
      }

      // Skip if strength is NONE
      if (strength === 'NONE') {
        continue;
      }

      // Build reason string
      const reason = `Follows ${candle.timeSlot} ${candle.direction} pattern (${pattern.relationship}, ${pattern.confidence}%)`;

      // Create projection
      const projection: TodayProjection = {
        timeSlot: targetSlot,
        expectedDirection,
        bias,
        strength,
        confidence: pattern.confidence,
        sampleSize: pattern.sampleSize,
        reason,
        triggerSlot: candle.timeSlot
      };

      // Store projection (keep highest confidence if multiple patterns point to same slot)
      const existing = projections.get(targetSlot);
      if (!existing || projection.confidence > existing.confidence) {
        projections.set(targetSlot, projection);
      }
    }
  }

  // Convert to array and sort by time slot
  return Array.from(projections.values())
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
}

/**
 * Generate complete today analysis
 */
export function generateTodayAnalysis(
  rows: Array<{
    torontoDate: Date;
    open: number;
    close: number;
  }>,
  patterns: PatternRelationship[],
  noiseThreshold: number,
  config: TodayModeConfig
): TodayAnalysis {
  const todayDate = config.currentTime.toISOString().split('T')[0];

  // Analyze completed candles
  const completedCandles = analyzeTodayCandles(
    rows,
    noiseThreshold,
    todayDate,
    config.currentTime
  );

  // Calculate morning bias
  const { bias: morningBias, strength: morningStrength } = calculateMorningBias(completedCandles);

  // Get all possible 15-min slots (00:00 to 23:45)
  const allSlots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }
  }

  // Project remaining slots
  const projections = projectRemainingSlots(
    completedCandles,
    patterns,
    allSlots,
    config
  );

  return {
    date: todayDate,
    completedCandles,
    projections,
    morningBias,
    morningStrength
  };
}

/**
 * Get all unique time slots from data
 * Helper for generating slot lists
 */
export function getAllTimeSlots(
  rows: Array<{ torontoDate: Date }>
): string[] {
  const slots = new Set<string>();
  for (const row of rows) {
    const timeSlot = row.torontoDate.toTimeString().slice(0, 5);
    slots.add(timeSlot);
  }
  return Array.from(slots).sort();
}
