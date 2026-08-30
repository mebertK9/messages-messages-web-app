export type NotificationType =
  | "wishOnTrip"
  | "wishRetracted"
  | "wishNotFound"
  | "wishAddedToActiveTrip";

export interface Notification {
  id: string;
  wishId: string;
  recipientId: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}
