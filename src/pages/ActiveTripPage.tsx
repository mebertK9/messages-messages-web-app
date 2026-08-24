import { ShoppingTripDetail } from "../types/trip";

interface Props {
  trip: ShoppingTripDetail;
  onBack: () => void;
}

export default function ActiveTripPage({ trip, onBack }: Props) {
  return (
    <div className="container">
      <div className="card">
        <h1>Einkauf läuft</h1>
        <p>Hier kann später der Einkauf abgeschlossen werden.</p>
        <p className="trip-stub-id">Trip-ID: {trip.id}</p>
        <button onClick={onBack}>Zurück zum Dashboard</button>
      </div>
    </div>
  );
}
