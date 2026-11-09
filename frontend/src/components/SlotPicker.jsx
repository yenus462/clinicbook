import { useCallback } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchSlots } from "../api/doctors";
import PageState from "./PageState";
import "./SlotPicker.css";

// Shows the free 30-minute slots of one doctor on one date.
// To load the slots again, give this component a new "key" from the parent.
function SlotPicker({ doctorId, date, selected, onSelect }) {
  const request = useCallback(() => fetchSlots(doctorId, date), [doctorId, date]);
  const { data, loading, error, reload } = useFetch(request);

  if (loading || error) {
    return <PageState loading={loading} error={error} onRetry={reload} />;
  }

  if (!data.isWorkingDay) {
    return (
      <p className="slot-message">
        The doctor does not work on this day. Please choose another date.
      </p>
    );
  }

  if (data.slots.length === 0) {
    return <p className="slot-message">No free times are left on this day. Please choose another date.</p>;
  }

  return (
    <div className="slot-grid">
      {data.slots.map((time) => (
        <button
          key={time}
          type="button"
          className={time === selected ? "slot-button slot-selected" : "slot-button"}
          onClick={() => onSelect(time)}
        >
          {time}
        </button>
      ))}
    </div>
  );
}

export default SlotPicker;