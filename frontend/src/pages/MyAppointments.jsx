import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { sampleAppointments } from "../data/sampleData";
import "./Tables.css";

// In Stage 7 this will be the logged-in patient from the login token.
const CURRENT_PATIENT = "Demo Patient";

function MyAppointments() {
  // A patient only sees their own appointments (rule 11)
  const [appointments, setAppointments] = useState(
    sampleAppointments.filter((a) => a.patient === CURRENT_PATIENT)
  );

  const handleCancel = (id) => {
    if (!window.confirm("Do you really want to cancel this appointment?")) {
      return;
    }
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
    );
  };

  return (
    <div className="page-container">
      <h1>My Appointments</h1>
      <p className="page-subtitle">See your bookings and cancel if your plans change.</p>

      <div className="table-wrapper">
        {appointments.length === 0 ? (
          <p className="empty-message">
            You have no appointments yet. <Link to="/doctors">Find a doctor</Link>
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
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.doctor}</strong>
                    <br />
                    {a.specialty}
                  </td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.reason}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    {a.status === "BOOKED" ? (
                      <button
                        className="small-button"
                        onClick={() => handleCancel(a.id)}
                      >
                        Cancel
                      </button>
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
    </div>
  );
}

export default MyAppointments;