import { LeetCodeDifficulty, RecallRating, ReviewResponsePayload } from '@leetcoach/shared';

interface SM2Input {
  rating: RecallRating;
  difficulty: LeetCodeDifficulty;
  currentEaseFactor: number;
  currentRepetition: number;
  currentIntervalDays: number;
}

export class SM2Service {
  /**
   * Calculates next spaced repetition intervals using custom SM-2 logic
   */
  public static calculate(params: SM2Input): ReviewResponsePayload {
    const { rating, difficulty, currentEaseFactor, currentRepetition, currentIntervalDays } = params;

    // Map rating quality
    // Green (Confidently remembered) = 5
    // Yellow (Remembered with effort) = 3
    // Red (Forgot / could not write) = 1
    const q = rating === 'Green' ? 5 : rating === 'Yellow' ? 3 : 1;

    // Calculate new Ease Factor (EF')
    let easeFactor = currentEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    let nextRepetition = currentRepetition;
    let nextIntervalDays = 1;

    if (q < 3) {
      // Forgot target problem: reset repetition cycle
      nextRepetition = 0;
      nextIntervalDays = 1;
    } else {
      // Correct recall: advance repetition cycle
      if (currentRepetition === 0) {
        nextIntervalDays = 1;
      } else if (currentRepetition === 1) {
        nextIntervalDays = 3; // Custom coding interval step
      } else {
        nextIntervalDays = Math.round(currentIntervalDays * easeFactor);
      }
      nextRepetition += 1;
    }

    // Apply difficulty modifiers to final interval duration
    if (difficulty === 'Hard') {
      nextIntervalDays = Math.max(1, Math.round(nextIntervalDays * 0.8));
    } else if (difficulty === 'Easy') {
      nextIntervalDays = Math.max(1, Math.round(nextIntervalDays * 1.2));
    }

    // Calculate next review timestamp
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);
    // Set to start of the day for consistent daily revision queue querying
    nextReviewDate.setHours(0, 0, 0, 0);

    return {
      easeFactor: parseFloat(easeFactor.toFixed(3)),
      repetition: nextRepetition,
      intervalDays: nextIntervalDays,
      nextReview: nextReviewDate.toISOString(),
    };
  }
}
