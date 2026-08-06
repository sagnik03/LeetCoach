import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.js';

interface Problem {
  id: string;
  leetcodeId: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  url: string;
  topicTags: string[];
}

interface Submission {
  id: string;
  code: string;
  language: string;
  status: string;
  submittedAt: string;
}

interface Mistake {
  id: string;
  description: string;
  category: string;
  preventionPlan: string;
}

export interface UserProblem {
  id: string;
  userId: string;
  problemId: string;
  masteryLevel: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewed: string | null;
  nextReview: string;
  lastRating: string | null;
  notes: string;
  aiSummary: string | null;
  problem: Problem;
  submissions: Submission[];
  mistakes: Mistake[];
}

interface QueueContextType {
  queue: UserProblem[];
  isLoading: boolean;
  error: string | null;
  fetchQueue: () => Promise<void>;
  submitReview: (userProblemId: string, rating: 'Green' | 'Yellow' | 'Red', durationSeconds?: number) => Promise<boolean>;
  saveNotes: (userProblemId: string, notes: string) => Promise<boolean>;
  logMistake: (userProblemId: string, mistake: { description: string; category: string; preventionPlan: string }) => Promise<boolean>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [queue, setQueue] = useState<UserProblem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/problems/queue', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch revision queue');
      }
      setQueue(data.queue || []);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading queue');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Re-fetch queue when user changes or when a problem sync event occurs
  useEffect(() => {
    if (user && token) {
      fetchQueue();
    } else {
      setQueue([]);
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const listener = (message: any) => {
        if (message.type === 'PROBLEM_SYNCED') {
          fetchQueue();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [user, token, fetchQueue]);

  const submitReview = async (
    userProblemId: string, 
    rating: 'Green' | 'Yellow' | 'Red', 
    durationSeconds?: number
  ): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:3000/api/problems/${userProblemId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, durationSeconds })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit review rating');
      }

      // Remove from queue or update details
      setQueue(prev => prev.filter(item => item.id !== userProblemId));
      return true;
    } catch (err) {
      console.error('Error in review submission', err);
      return false;
    }
  };

  const saveNotes = async (userProblemId: string, notes: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:3000/api/problems/${userProblemId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update problem notes');
      }

      // Update in queue
      setQueue(prev =>
        prev.map(item => (item.id === userProblemId ? { ...item, notes } : item))
      );
      return true;
    } catch (err) {
      console.error('Error updating notes', err);
      return false;
    }
  };

  const logMistake = async (
    userProblemId: string, 
    mistake: { description: string; category: string; preventionPlan: string }
  ): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:3000/api/problems/${userProblemId}/mistakes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mistake)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save mistake log');
      }

      // Update in queue
      setQueue(prev =>
        prev.map(item => {
          if (item.id === userProblemId) {
            return {
              ...item,
              mistakes: [...(item.mistakes || []), data.mistake]
            };
          }
          return item;
        })
      );
      return true;
    } catch (err) {
      console.error('Error logging mistake', err);
      return false;
    }
  };

  return (
    <QueueContext.Provider value={{
      queue,
      isLoading,
      error,
      fetchQueue,
      submitReview,
      saveNotes,
      logMistake
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
