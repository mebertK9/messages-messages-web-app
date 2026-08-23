import { apiFetch } from "./api";
import { Shop } from "../types/domain";

export async function listShops(): Promise<Shop[]> {
  return apiFetch<Shop[]>("/shops");
}
