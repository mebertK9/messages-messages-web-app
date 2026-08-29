import { Wish } from "./domain";

// Trip-related types, mirroring the ShoppingTrip/TripStop schemas in openapi.yml.
// Kept separate from ./domain so this file doesn't need to touch code we haven't seen.

export type TripStatus = "active" | "done";
export type StopStatus = "active" | "done";

export interface TripStop {
  id: string;
  tripId: string;
  shopId: string;
  status: StopStatus;
}

export interface TripStopWithWishes extends TripStop {
  wishes: Wish[];
}

export interface ShoppingTrip {
  id: string;
  startedById: string;
  status: TripStatus;
  startedAt: string;
}

export interface ShoppingTripDetail extends ShoppingTrip {
  stops: TripStopWithWishes[];
}

export interface CreateTripStopRequest {
  shopId: string;
  wishIds: string[];
}

export interface CreateTripRequest {
  stops: CreateTripStopRequest[];
}

export interface CompleteTripStopRequest {
  // Wishes the buyer could not find at the shop - sent back to "open" by the
  // server and reported to their creators. Everything else assigned to the
  // stop is set to "purchased".
  notFoundWishIds: string[];
}
