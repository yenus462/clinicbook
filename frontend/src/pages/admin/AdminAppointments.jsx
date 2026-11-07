import { useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { sampleAppointments } from "../../data/sampleData";
import "../Tables.css";
import "./Admin.css";

function AdminAppointments() {
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Change one appointment's status
  const handleStatusChange = (id, newStatus) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  // Show only the appointments that match the chosen filter
  const visibleAppointments =
    statusFilter === "ALL"
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  return (
    <div className="page-container">
      <h1>All Appointments</h1>
      <p className="page-subtitle">
        Mark visits as completed or cancelled. A finished appointment cannot go
        back to booked.
      </p>

      <div className="filter-bar">
        <label htmlFor="statusFilter">
          <strong>Filter by status:</strong>
        </label>
        <select
          id="statusFilter"
          className="admin-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All</option>
          <option value="BOOKED">Booked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="table-wrapper">
        {visibleAppointments.length === 0 ? (
          <p className="empty-message">No appointments match this filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Change status</th>
              </tr>
            </thead>
            <tbody>
              {visibleAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.patient}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.reason}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    {/* Rule 13: only BOOKED appointments can be changed */}
                    <select
                      className="admin-select"
                      value={a.status}
                      disabled={a.status !== "BOOKED"}
                      onChange={(event) =>
                        handleStatusChange(a.id, event.target.value)
                      }
                    >
                      <option value="BOOKED">Booked</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
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

export default AdminAppointments;