import { Response, NextFunction } from 'express';
import { and, eq, lte, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { problems, userProblems, codeSubmissions, reviewLogs, mistakes } from '../db/schema.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { SM2Service } from '../services/sm2.service.js';
import { LeetCodeDifficulty, RecallRating } from '@leetcoach/shared';

export async function syncProblem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const {
      leetcodeId,
      title,
      titleSlug,
      difficulty,
      url,
      topicTags,
      code,
      language,
      status
    } = req.body;

    if (!leetcodeId || !title || !titleSlug || !difficulty || !url) {
      return res.status(400).json({ success: false, message: 'Missing problem metadata parameters.' });
    }

    // 1. Ensure problem exists in global problems cache
    let problemRecord = await db.query.problems.findFirst({
      where: eq(problems.leetcodeId, leetcodeId)
    });

    if (!problemRecord) {
      const [newProblem] = await db.insert(problems).values({
        leetcodeId,
        title,
        titleSlug,
        difficulty,
        url,
        topicTags: topicTags || []
      }).returning();
      problemRecord = newProblem;
    }

    // 2. Ensure user-problem junction record exists
    let userProblemRecord = await db.query.userProblems.findFirst({
      where: and(
        eq(userProblems.userId, userId),
        eq(userProblems.problemId, problemRecord.id)
      )
    });

    let isNewRecord = false;
    if (!userProblemRecord) {
      const [newUserProblem] = await db.insert(userProblems).values({
        userId,
        problemId: problemRecord.id,
        masteryLevel: 0,
        easeFactor: 2.5,
        reviewCount: 0,
        nextReview: new Date() // ready for review immediately or after sync
      }).returning();
      userProblemRecord = newUserProblem;
      isNewRecord = true;
    }

    // 3. Save code submission history
    if (code && language) {
      await db.insert(codeSubmissions).values({
        userProblemId: userProblemRecord.id,
        code,
        language,
        status: status || 'Accepted'
      });
    }

    return res.status(isNewRecord ? 201 : 200).json({
      success: true,
      message: 'Problem synced successfully',
      data: {
        ...userProblemRecord,
        problem: problemRecord
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevisionQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const now = new Date();

    // Query all user problems due for review
    const queue = await db.query.userProblems.findMany({
      where: and(
        eq(userProblems.userId, userId),
        lte(userProblems.nextReview, now)
      ),
      limit,
      with: {
        problem: true,
        submissions: {
          orderBy: [desc(codeSubmissions.submittedAt)],
          limit: 1
        },
        mistakes: true
      }
    });

    return res.status(200).json({
      success: true,
      queue
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewProblem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { userProblemId } = req.params;
    const { rating, durationSeconds } = req.body;

    if (!rating || !['Green', 'Yellow', 'Red'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'Invalid rating. Expected Green, Yellow, or Red.' });
    }

    // Retrieve user problem record
    const userProblemRecord = await db.query.userProblems.findFirst({
      where: and(
        eq(userProblems.id, userProblemId),
        eq(userProblems.userId, userId)
      ),
      with: {
        problem: true
      }
    });

    if (!userProblemRecord) {
      return res.status(404).json({ success: false, message: 'Revision card not found.' });
    }

    // Execute SM-2 calculation
    const sm2Result = SM2Service.calculate({
      rating: rating as RecallRating,
      difficulty: userProblemRecord.problem.difficulty as LeetCodeDifficulty,
      currentEaseFactor: userProblemRecord.easeFactor,
      currentRepetition: userProblemRecord.masteryLevel,
      currentIntervalDays: userProblemRecord.reviewCount > 0 ? Math.max(1, Math.round((userProblemRecord.nextReview.getTime() - (userProblemRecord.lastReviewed?.getTime() || userProblemRecord.createdAt.getTime())) / (1000 * 60 * 60 * 24))) : 1
    });

    // Update revision parameters
    const nextReviewDate = new Date(sm2Result.nextReview);
    
    const [updatedUserProblem] = await db.update(userProblems)
      .set({
        masteryLevel: sm2Result.repetition,
        easeFactor: sm2Result.easeFactor,
        reviewCount: userProblemRecord.reviewCount + 1,
        lastReviewed: new Date(),
        nextReview: nextReviewDate,
        lastRating: rating as RecallRating
      })
      .where(eq(userProblems.id, userProblemId))
      .returning();

    // Log review activity history
    await db.insert(reviewLogs).values({
      userProblemId,
      rating,
      easeFactor: sm2Result.easeFactor,
      intervalDays: sm2Result.intervalDays,
      reviewDurationSeconds: durationSeconds || null
    });

    return res.status(200).json({
      success: true,
      data: updatedUserProblem
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { userProblemId } = req.params;
    const { notes } = req.body;

    const [updated] = await db.update(userProblems)
      .set({ notes: notes || '', updatedAt: new Date() })
      .where(and(
        eq(userProblems.id, userProblemId),
        eq(userProblems.userId, userId)
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Problem tracker not found.' });
    }

    // Note: in Milestone 4, this will trigger background embedding regenerations

    return res.status(200).json({
      success: true,
      notes: updated.notes
    });
  } catch (error) {
    next(error);
  }
}

export async function addMistake(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { userProblemId } = req.params;
    const { description, category, preventionPlan } = req.body;

    if (!description || !category || !preventionPlan) {
      return res.status(400).json({ success: false, message: 'Description, category, and prevention plan are required.' });
    }

    // Verify ownership
    const userProblemRecord = await db.query.userProblems.findFirst({
      where: and(
        eq(userProblems.id, userProblemId),
        eq(userProblems.userId, userId)
      )
    });

    if (!userProblemRecord) {
      return res.status(404).json({ success: false, message: 'Problem tracker not found.' });
    }

    const [newMistake] = await db.insert(mistakes).values({
      userProblemId,
      description,
      category,
      preventionPlan
    }).returning();

    // Note: in Milestone 4, this will trigger background embedding additions

    return res.status(201).json({
      success: true,
      mistake: newMistake
    });
  } catch (error) {
    next(error);
  }
}
