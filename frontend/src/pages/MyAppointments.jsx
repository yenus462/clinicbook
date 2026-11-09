import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import PageState from "../components/PageState";
import Alert from "../components/Alert";
import SlotPicker from "../components/SlotPicker";
import { useFetch } from "../hooks/useFetch";
import {
  fetchMyAppointments,
  cancelMyAppointment,
  rescheduleMyAppointment,
} from "../api/appointments";
import { getErrorMessage } from "../api/client";
import { formatDate, todayInClinic, addDays, MAX_DAYS_AHEAD } from "../lib/format";
import "./Tables.css";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "BOOKED", label: "Booked" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function MyAppointments() {
  const { data: appointments, loading, error, reload } = useFetch(fetchMyAppointments);

  const [filter, setFilter] = useState("ALL");
  const [notice, setNotice] = useState({ type: "success", text: "" });
  const [busy, setBusy] = useState(false);

  // The appointment being rescheduled (or null), and the new choices
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [slotRefresh, setSlotRefresh] = useState(0);

  const visible = appointments
    ? appointments.filter((a) => filter === "ALL" || a.status === filter)
    : [];

  const handleCancel = async (appointment) => {
    const question =
      "Cancel your appointment with " +
      appointment.doctor.name +
      " on " +
      formatDate(appointment.date) +
      " at " +
      appointment.startTime +
      "?";
    if (!window.confirm(question)) return;

    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      await cancelMyAppointment(appointment.id);
      setNotice({ type: "success", text: "Your appointment was cancelled." });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
      reload();
    }
  };

  const openReschedule = (appointment) => {
    setRescheduling(appointment);
    setNewDate("");
    setNewSlot("");
    setNotice({ type: "success", text: "" });
  };

  const handleReschedule = async () => {
    if (!newDate || !newSlot) {
      setNotice({ type: "error", text: "Please choose a new date and time." });
      return;
    }

    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      await rescheduleMyAppointment(rescheduling.id, newDate, newSlot);
      setNotice({
        type: "success",
        text: "Moved to " + formatDate(newDate) + " at " + newSlot + ".",
      });
      setRescheduling(null);
      reload();
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
      if (err.response && err.response.status === 409) {
        setNewSlot("");
        setSlotRefresh((count) => count + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  const today = todayInClinic();

  return (
    <div className="page-container">
      <h1>My Appointments</h1>
      <p className="page-subtitle">See your bookings, change them, or cancel.</p>

      <Alert type={notice.type} message={notice.text} />

      {rescheduling && (
        <div className="panel">
          <h2>Reschedule</h2>
          <p>
            {rescheduling.doctor.name}, now on {formatDate(rescheduling.date)} at{" "}
            {rescheduling.startTime}
          </p>

          <label htmlFor="new-date" className="cell-sub" style={{ marginTop: "12px" }}>
            New date
          </label>
          <input
            id="new-date"
            type="date"
            className="admin-input"
            min={today}
            max={addDays(today, MAX_DAYS_AHEAD)}
            value={newDate}
            onChange={(event) => {
              setNewDate(event.target.value);
              setNewSlot("");
            }}
          />

          {newDate && (
            <SlotPicker
              key={newDate + "-" + slotRefresh}
              doctorId={rescheduling.doctor.id}
              date={newDate}
              selected={newSlot}
              onSelect={setNewSlot}
            />
          )}

          <div className="panel-actions">
            <button
              type="button"
              className="primary-button"
              disabled={busy || !newDate || !newSlot}
              onClick={handleReschedule}
            >
              {busy ? "Saving..." : "Confirm new time"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRescheduling(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="tab-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={filter === f.value ? "tab-button tab-active" : "tab-button"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <PageState loading={loading} error={error} onRetry={reload} />

      {appointments && (
        <div className="table-wrapper">
          {visible.length === 0 ? (
            <p className="empty-message">
              {appointments.length === 0 ? (
                <>
                  You have no appointments yet. <Link to="/doctors">Find a doctor</Link>
                </>
              ) : (
                "No appointments in this tab."
              )}
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.doctor.name}</strong>
                      <span className="cell-sub">{a.doctor.specialty.name}</span>
                    </td>
                    <td>{formatDate(a.date)}</td>
                    <td>
                      {a.startTime} - {a.endTime}
                    </td>
                    <td>{a.reason}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      {a.canChange ? (
                        <div className="action-group">
                          <button
                            type="button"
                            className="small-button small-button-blue"
                            disabled={busy}
                            onClick={() => openReschedule(a)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="small-button"
                            disabled={busy}
                            onClick={() => handleCancel(a)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : a.status === "BOOKED" ? (
                        <span className="cell-sub">
                          Less than 2 hours away. Please call the clinic.
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;