interface QueueEntry {
  userId: string;
  nickname: string;
  timer: ReturnType<typeof setTimeout>;
}

const queue = new Map<string, QueueEntry>();
const MATCH_TIMEOUT_MS = 30_000;

export function enqueue(
  socketId: string,
  userId: string,
  nickname: string,
  onMatch: (
    socketIdA: string, userIdA: string, nicknameA: string,
    socketIdB: string, userIdB: string, nicknameB: string
  ) => void,
  onTimeout: (socketId: string) => void
): void {
  // If someone is already waiting, match immediately
  for (const [waitingSocketId, entry] of queue.entries()) {
    clearTimeout(entry.timer);
    queue.delete(waitingSocketId);
    onMatch(waitingSocketId, entry.userId, entry.nickname, socketId, userId, nickname);
    return;
  }

  // No one waiting — add to queue with timeout
  const timer = setTimeout(() => {
    queue.delete(socketId);
    onTimeout(socketId);
  }, MATCH_TIMEOUT_MS);

  queue.set(socketId, { userId, nickname, timer });
}

export function dequeue(socketId: string): void {
  const entry = queue.get(socketId);
  if (entry) {
    clearTimeout(entry.timer);
    queue.delete(socketId);
  }
}
