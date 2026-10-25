import type { Server as SocketServer } from "socket.io";

export interface ExamResponseEvent {
  examId: string;
  examTitle: string;
  userId: string;
  username: string;
  respondersCount: number;
  at: string;
}

let io: SocketServer | null = null;

export function setRealtimeServer(server: SocketServer): void {
  io = server;
}

/**
 * Broadcast to every connected client, regardless of the page they are on.
 * Called by the REST controller after a successful self-response.
 */
export function emitExamResponse(event: ExamResponseEvent): void {
  io?.emit("exam:response", event);
}
