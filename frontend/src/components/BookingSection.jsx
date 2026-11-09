import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { bookAppointment } from "../api/appointments";
import { getErrorMessage } from "../api/client";
import { todayInClinic, addDays, formatDate, MAX_DAYS_AHEAD } from "../lib/format";
import SlotPicker from "./SlotPicker";
import Alert from "./Alert";
import "./BookingSection.css";

function BookingSection({ doctorId }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  if (loading) {
    return (
      <div className="doctor-details-card">
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in: the login page brings the user back here afterwards
  if (!user) {
    return (
      <div className="doctor-details-card">
        <h2>Book an appointment</h2>
        <p>Please log in as a patient to book.</p>
        <p>
          <Link to="/login" state={{ from: location }}>
            Login
          </Link>{" "}
          or <Link to="/register">create an account</Link>.
        </p>
      </div>
    );
  }

  if (user.role !== "PATIENT") {
    return (
      <div className="doctor-details-card">
        <h2>Book an appointment</h2>
        <p>Admin accounts cannot book appointments. Please use a patient account.</p>
      </div>
    );
  }

  const today = todayInClinic();

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setSlot("");
    setError("");
    setSuccess("");
  };

  const handleBook = async () => {
    setError("");
    setSuccess("");

    if (!date || !slot) {
      setError("Please choose a date and a time.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Please write a short reason (at least 3 characters).");
      return;
    }

    setSubmitting(true);
    try {
      await bookAppointment({ doctorId, date, startTime: slot, reason: reason.trim() });
      setSuccess("Booked! Your appointment is on " + formatDate(date) + " at " + slot + ".");
      setSlot("");
      setReason("");
      setRefreshCount((count) => count + 1); // reload the slots, the booked one disappears
    } catch (err) {
      setError(getErrorMessage(err));
      if (err.response && err.response.status === 409) {
        // Someone took the slot first: reload the free times
        setSlot("");
        setRefreshCount((count) => count + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doctor-details-card">
      <h2>Book an appointment</h2>

      <label htmlFor="booking-date" className="booking-label">
        Choose a date (up to {MAX_DAYS_AHEAD} days ahead)
      </label>
      <input
        id="booking-date"
        type="date"
        className="booking-date"
        min={today}
        max={addDays(today, MAX_DAYS_AHEAD)}
        value={date}
        onChange={handleDateChange}
      />

      {date && (
        <div>
          <p className="booking-label">Free times on {formatDate(date)}</p>
          <SlotPicker
            key={date + "-" + refreshCount}
            doctorId={doctorId}
            date={date}
            selected={slot}
            onSelect={setSlot}
          />
        </div>
      )}

      {date && slot && (
        <div>
          <label htmlFor="booking-reason" className="booking-label">
            Reason for the visit
          </label>
          <textarea
            id="booking-reason"
            className="booking-reason"
            rows="3"
            maxLength="300"
            placeholder="For example: check-up, headache, follow-up"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <button
            type="button"
            className="booking-button"
            disabled={submitting}
            onClick={handleBook}
          >
            {submitting ? "Booking..." : "Book " + slot + " on " + date}
          </button>
        </div>
      )}

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />
      {success && (
        <p>
          <Link to="/my-appointments">View my appointments</Link>
        </p>
      )}
    </div>
  );
}

export default BookingSection;