type NotificationChangeListener = () => void;

const listeners = new Set<NotificationChangeListener>();

// Notifies subscribers (e.g. the notification bell) that the unread count may
// have changed, so they can refetch. Mutations in client.ts call this after
// any read/dismiss/delete action performed anywhere in the app.
export function notifyNotificationsChanged(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeNotificationsChanged(
  listener: NotificationChangeListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
