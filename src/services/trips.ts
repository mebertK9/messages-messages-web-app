import { apiFetch } from "./api";
import {
  CompleteTripStopRequest,
  CreateTripRequest,
  ShoppingTrip,
  ShoppingTripDetail,
  TripStatus,
  TripStop
} from "../types/trip";

export async function createTrip(request: CreateTripRequest): Promise<ShoppingTripDetail> {
  return apiFetch<ShoppingTripDetail>("/trips", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

/** Lists trips (without stop/wish detail), optionally filtered by status.
 * Used by the dashboard to check whether a trip is already running, so it
 * knows whether clicking a shop should resume that trip instead of staging
 * a new one - MVP only ever expects at most one active trip. */
export async function listTrips(status?: TripStatus): Promise<ShoppingTrip[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<ShoppingTrip[]>(`/trips${query}`);
}

/** Fetches the current state of a trip, including all stops and their
 * currently assigned wishes. Used both for the initial load and for polling
 * on the active trip screen. */
export async function getTrip(tripId: string): Promise<ShoppingTripDetail> {
  return apiFetch<ShoppingTripDetail>(`/trips/${tripId}`);
}

/**
 * Completes a stop: wishes not listed in notFoundWishIds are marked
 * purchased server-side, the listed ones go back to open. If this was the
 * trip's last active stop, the server also marks the whole trip done - the
 * caller should re-fetch the trip afterwards to pick that up rather than
 * relying on this response alone.
 */
export async function completeTripStop(
  tripId: string,
  stopId: string,
  notFoundWishIds: string[]
): Promise<TripStop> {
  const request: CompleteTripStopRequest = { notFoundWishIds };
  return apiFetch<TripStop>(`/trips/${tripId}/stops/${stopId}/complete`, {
    method: "POST",
    body: JSON.stringify(request)
  });
}
