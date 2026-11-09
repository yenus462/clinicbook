import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import PageState from "../../components/PageState";
import Alert from "../../components/Alert";
import { useFetch } from "../../hooks/useFetch";
import {
  fetchAdminAppointments,
  fetchAdminDoctors,
  updateAppointmentStatus,
} from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import { formatDate, todayInClinic } from "../../lib/format";
import "../Tables.css";
import "./Admin.css";

const PAGE_SIZE = 10;

function AdminAppointments() {
  // Filters. Search is applied when the admin clicks Search.
  const [status, setStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [notice, setNotice] = useState({ type: "success", text: "" });
  const [busy, setBusy] = useState(false);

  const { data: doctors } = useFetch(fetchAdminDoctors);

  const request = useCallback(
    () => fetchAdminAppointments({ status, doctorId, date, search, page, pageSize: PAGE_SIZE }),
    [status, doctorId, date, search, page]
  );
  const { data, loading, error, reload } = useFetch(request);

  // Changing a filter goes back to the first page
  const onFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setStatus("");
    setDoctorId("");
    setDate("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleStatus = async (appointment, newStatus) => {
    const verb = newStatus === "COMPLETED" ? "Mark as completed" : "Cancel";
    const question =
      verb + " the appointment of " + appointment.patient.name + " on " +
      formatDate(appointment.date) + " at " + appointment.startTime + "? This cannot be undone.";
    if (!window.confirm(question)) return;

    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      await updateAppointmentStatus(appointment.id, newStatus);
      setNotice({ type: "success", text: "Appointment marked as " + newStatus + "." });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
      reload();
    }
  };

  const today = todayInClinic();
  const pagination = data ? data.pagination : null;

  return (
    <div className="page-container">
      <Link to="/admin" className="back-link">
        ← Dashboard
      </Link>
      <h1>All Appointments</h1>
      <p className="page-subtitle">
        Mark visits as completed or cancel them. COMPLETED and CANCELLED are final.
      </p>

      <div className="filter-bar">
        <div className="filter-field">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className="admin-select"
            value={status}
            onChange={onFilterChange(setStatus)}
          >
            <option value="">All</option>
            <option value="BOOKED">Booked</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="filter-doctor">Doctor</label>
          <select
            id="filter-doctor"
            className="admin-select"
            value={doctorId}
            onChange={onFilterChange(setDoctorId)}
          >
            <option value="">All doctors</option>
            {(doctors || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="filter-date">Date</label>
          <input
            id="filter-date"
            type="date"
            className="admin-input"
            value={date}
            onChange={onFilterChange(setDate)}
          />
        </div>

        <form className="filter-field" onSubmit={handleSearch}>
          <label htmlFor="filter-search">Search patient or doctor</label>
          <div className="action-group">
            <input
              id="filter-search"
              type="text"
              className="admin-input"
              placeholder="Name or email"
              maxLength="100"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="primary-button">
              Search
            </button>
          </div>
        </form>

        <button type="button" className="secondary-button" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      <Alert type={notice.type} message={notice.text} />
      <PageState loading={loading} error={error} onRetry={reload} />

      {data && (
        <>
          <div className="table-wrapper">
            {data.appointments.length === 0 ? (
              <p className="empty-message">No appointments match these filters.</p>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.patient.name}</strong>
                        <span className="cell-sub">{a.patient.email}</span>
                        <span className="cell-sub">{a.patient.phone}</span>
                      </td>
                      <td>
                        {a.doctor.name}
                        <span className="cell-sub">{a.doctor.specialty.name}</span>
                      </td>
                      <td>{formatDate(a.date)}</td>
                      <td>{a.startTime}</td>
                      <td>{a.reason}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        {a.status === "BOOKED" ? (
                          <div className="action-group">
                            <button
                              type="button"
                              className="small-button small-button-blue"
                              disabled={busy || a.date > today}
                              title={
                                a.date > today
                                  ? "An appointment cannot be completed before its date."
                                  : "Mark as completed"
                              }
                              onClick={() => handleStatus(a, "COMPLETED")}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              className="small-button"
                              disabled={busy}
                              onClick={() => handleStatus(a, "CANCELLED")}
                            >
                              Cancel
                            </button>
                          </div>
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

          {pagination && pagination.totalPages > 0 && (
            <div className="pagination">
              <button
                type="button"
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} appointments)
              </span>
              <button
                type="button"
                className="secondary-button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminAppointments;