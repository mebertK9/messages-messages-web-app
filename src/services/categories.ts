import { apiFetch } from "./api";
import { Category } from "../types/domain";

export async function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}
