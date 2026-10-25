export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface ExamSummary {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  passedCount: number;
  uniqueUsers: number;
}

export interface ExamDetail extends ExamSummary {
  checkedBy: {
    id: string;
    username: string;
    passes: number;
  }[];
  responders: {
    id: string;
    username: string;
  }[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
}

export interface AwardResult {
  id: string;
  passed: boolean;
  passedCount: number;
}
