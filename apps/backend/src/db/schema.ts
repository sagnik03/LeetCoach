import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  timestamp, 
  doublePrecision, 
  vector, 
  index, 
  unique 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Global Problems Cache (Avoids redundant metadata storage)
export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  leetcodeId: integer('leetcode_id').notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  titleSlug: varchar('title_slug', { length: 255 }).notNull().unique(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // Easy, Medium, Hard
  url: varchar('url', { length: 512 }).notNull(),
  topicTags: text('topic_tags').array().notNull(), // e.g. ['Array', 'Hash Table']
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. User-Problem Join Table (Stores mastery state & revision scheduling)
export const userProblems = pgTable('user_problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  
  // Spaced Repetition Variables (SM-2)
  masteryLevel: integer('mastery_level').default(0).notNull(), // Repetition count
  easeFactor: doublePrecision('ease_factor').default(2.5).notNull(), // Ease Factor (starts at 2.5)
  reviewCount: integer('review_count').default(0).notNull(),
  lastReviewed: timestamp('last_reviewed'),
  nextReview: timestamp('next_review').defaultNow().notNull(),
  lastRating: varchar('last_rating', { length: 20 }), // Green, Yellow, Red
  
  // Custom Notes and AI Summaries
  notes: text('notes').default(''),
  aiSummary: text('ai_summary'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userProblemUnique: unique().on(t.userId, t.problemId),
  nextReviewIdx: index('next_review_idx').on(t.nextReview),
}));

// 4. Code Submissions History
export const codeSubmissions = pgTable('code_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userProblemId: uuid('user_problem_id').references(() => userProblems.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Accepted, Wrong Answer, etc.
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// 5. Mistake Logs
export const mistakes = pgTable('mistakes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userProblemId: uuid('user_problem_id').references(() => userProblems.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // e.g. "Edge Case", "Time Limit Exceeded"
  preventionPlan: text('prevention_plan').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Detailed Review Logs (For historical analytics / streaks)
export const reviewLogs = pgTable('review_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userProblemId: uuid('user_problem_id').references(() => userProblems.id, { onDelete: 'cascade' }).notNull(),
  ratedAt: timestamp('rated_at').defaultNow().notNull(),
  rating: varchar('rating', { length: 20 }).notNull(), // Green, Yellow, Red
  easeFactor: doublePrecision('ease_factor').notNull(),
  intervalDays: integer('interval_days').notNull(),
  reviewDurationSeconds: integer('review_duration_seconds'), // Optional metric tracking speed
});

// 7. Vector Embeddings Table for RAG (Dual support: 1536 OpenAI or 768 Gemini)
export const embeddings = pgTable('embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userProblemId: uuid('user_problem_id').references(() => userProblems.id, { onDelete: 'cascade' }).notNull(),
  chunkType: varchar('chunk_type', { length: 50 }).notNull(), // 'summary', 'mistake', 'notes', 'code'
  contentChunk: text('content_chunk').notNull(),
  
  // pgvector column setup. Using 768 dimensions for Gemini text-embedding-004 by default.
  // Can be configured to 1536 if text-embedding-3-small is selected instead.
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  // HNSW index is highly optimized for cosine distance search
  embeddingIdx: index('embedding_hnsw_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
}));

// Schema Relations Definition
export const usersRelations = relations(users, ({ many }) => ({
  userProblems: many(userProblems),
}));

export const problemsRelations = relations(problems, ({ many }) => ({
  userProblems: many(userProblems),
}));

export const userProblemsRelations = relations(userProblems, ({ one, many }) => ({
  user: one(users, { fields: [userProblems.userId], references: [users.id] }),
  problem: one(problems, { fields: [userProblems.problemId], references: [problems.id] }),
  submissions: many(codeSubmissions),
  mistakes: many(mistakes),
  reviewLogs: many(reviewLogs),
  embeddings: many(embeddings),
}));

export const codeSubmissionsRelations = relations(codeSubmissions, ({ one }) => ({
  userProblem: one(userProblems, { fields: [codeSubmissions.userProblemId], references: [userProblems.id] }),
}));

export const mistakesRelations = relations(mistakes, ({ one }) => ({
  userProblem: one(userProblems, { fields: [mistakes.userProblemId], references: [userProblems.id] }),
}));

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
  userProblem: one(userProblems, { fields: [reviewLogs.userProblemId], references: [userProblems.id] }),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  userProblem: one(userProblems, { fields: [embeddings.userProblemId], references: [userProblems.id] }),
}));
