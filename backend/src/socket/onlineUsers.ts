/**
 * In-memory registry mapping userId -> set of active socket ids.
 * A user may have multiple tabs/devices open; we only consider them
 * "offline" once every socket has disconnected.
 */
class OnlineUsersRegistry {
  private userToSockets = new Map<string, Set<string>>();

  addSocket(userId: string, socketId: string): boolean {
    const wasOffline = !this.userToSockets.has(userId);
    const sockets = this.userToSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userToSockets.set(userId, sockets);
    return wasOffline;
  }

  /** Returns true if the user has no remaining active sockets (fully offline). */
  removeSocket(userId: string, socketId: string): boolean {
    const sockets = this.userToSockets.get(userId);
    if (!sockets) return true;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userToSockets.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return this.userToSockets.has(userId);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userToSockets.keys());
  }
}

export const onlineUsers = new OnlineUsersRegistry();
