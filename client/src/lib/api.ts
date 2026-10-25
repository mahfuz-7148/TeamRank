import type {
  AwardResult,
  ExamDetail,
  ExamSummary,
  LeaderboardEntry,
  User,
} from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  adminKey?: string;
}

async function request<T>(
  path: string,
  { method = "GET", body, adminKey }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (adminKey !== undefined) {
    headers["x-admin-key"] = adminKey;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "সার্ভারের সাথে সংযোগ করা যাচ্ছে না");
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response
  }

  if (!res.ok || !json || !json.success || json.data === undefined) {
    const fieldErrors = json?.errors;
    const firstField = fieldErrors
      ? Object.values(fieldErrors)[0]?.[0]
      : undefined;
    throw new ApiError(
      res.status,
      firstField ?? json?.message ?? "অপ্রত্যাশিত সমস্যা হয়েছে"
    );
  }

  return json.data;
}

// ---- Users ----

export function createUser(username: string): Promise<User> {
  return request<User>("/api/users", { method: "POST", body: { username } });
}

export function listUsers(): Promise<User[]> {
  return request<User[]>("/api/users");
}

export function deleteUser(
  adminKey: string,
  userId: string
): Promise<{ id: string; username: string }> {
  return request<{ id: string; username: string }>(`/api/users/${userId}`, {
    method: "DELETE",
    adminKey,
  });
}

// ---- Posts (exams) ----

export function listExams(): Promise<ExamSummary[]> {
  return request<ExamSummary[]>("/api/posts");
}

export function getExam(id: string): Promise<ExamDetail> {
  return request<ExamDetail>(`/api/posts/${id}`);
}

export interface RespondResult {
  id: string;
  responded: boolean;
  respondersCount: number;
}

// Adds the user's name to the "wants to answer" list. No pass, no points.
export function respondToExam(
  examId: string,
  userId: string
): Promise<RespondResult> {
  return request<RespondResult>(`/api/posts/${examId}/respond`, {
    method: "POST",
    body: { userId },
  });
}

export function createExam(
  adminKey: string,
  title: string,
  content: string
): Promise<ExamSummary> {
  return request<ExamSummary>("/api/posts", {
    method: "POST",
    body: { title, content },
    adminKey,
  });
}

export function deleteExam(
  adminKey: string,
  examId: string
): Promise<{ id: string; title: string }> {
  return request<{ id: string; title: string }>(`/api/posts/${examId}`, {
    method: "DELETE",
    adminKey,
  });
}

export function toggleAward(
  adminKey: string,
  examId: string,
  userId: string
): Promise<AwardResult> {
  return request<AwardResult>(`/api/posts/${examId}/award`, {
    method: "POST",
    body: { userId },
    adminKey,
  });
}

// ---- Leaderboard ----

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>("/api/leaderboard");
}
