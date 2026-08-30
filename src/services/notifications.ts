import { apiFetch } from "./api";
import { Notification } from "../types/notification";

export async function listNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications");
}
