export type LeetCodeDifficulty = 'Easy' | 'Medium' | 'Hard';

export type RecallRating = 'Green' | 'Yellow' | 'Red';

export interface LeetCodeSyncPayload {
  leetcodeId: number;
  title: string;
  titleSlug: string;
  difficulty: LeetCodeDifficulty;
  url: string;
  topicTags: string[];
  code: string;
  language: string;
  status: string;
}

export interface ReviewRequestPayload {
  rating: RecallRating;
  durationSeconds?: number;
}

export interface ReviewResponsePayload {
  easeFactor: number;
  repetition: number;
  intervalDays: number;
  nextReview: string;
}

export interface UserProblemData {
  id: string;
  userId: string;
  problemId: string;
  masteryLevel: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewed: string | null;
  nextReview: string;
  lastRating: RecallRating | null;
  notes: string;
  aiSummary: string | null;
  problem: {
    leetcodeId: number;
    title: string;
    titleSlug: string;
    difficulty: LeetCodeDifficulty;
    url: string;
    topicTags: string[];
  };
}

export interface DashboardData {
  streak: number;
  totalSolved: number;
  masteryDistribution: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  topicMastery: {
    topic: string;
    mastery: number; // percentage from 0 to 1
  }[];
  heatmap: Record<string, number>; // date "YYYY-MM-DD" -> count of reviews/solved
}
