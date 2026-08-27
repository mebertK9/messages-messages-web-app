import { apiFetch } from "./api";
import { CreateTripRequest, ShoppingTripDetail } from "../types/trip";

export async function createTrip(request: CreateTripRequest): Promise<ShoppingTripDetail> {
  return apiFetch<ShoppingTripDetail>("/trips", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
