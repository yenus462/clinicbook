import { useState } from "react";
import { Link } from "react-router-dom";
import PageState from "../../components/PageState";
import Alert from "../../components/Alert";
import DoctorForm from "./DoctorForm";
import { useFetch } from "../../hooks/useFetch";
import {
  fetchAdminDoctors,
  fetchAdminSpecialties,
  setDoctorStatus,
  deleteDoctor,
} from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import { formatWorkingHours } from "../../lib/format";
import "../Tables.css";
import "./Admin.css";

// Loads doctors and specialties together
async function loadData() {
  const [doctors, specialties] = await Promise.all([
    fetchAdminDoctors(),
    fetchAdminSpecialties(),
  ]);
  return { doctors, specialties };
}

function AdminDoctors() {
  const { data, loading, error, reload } = useFetch(loadData);

  // undefined = form closed, null = adding a new doctor, an object = editing that doctor
  const [formDoctor, setFormDoctor] = useState(undefined);
  const [notice, setNotice] = useState({ type: "success", text: "" });
  const [busy, setBusy] = useState(false);

  const handleSaved = (text) => {
    setFormDoctor(undefined);
    setNotice({ type: "success", text });
    reload();
  };

  // Rule 15: doctors are deactivated, not deleted, so appointment history stays intact
  const handleToggle = async (doctor) => {
    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      const result = await setDoctorStatus(doctor.id, !doctor.isActive);
      let text = result.message;
      if (!doctor.isActive === false && result.upcomingBookedAppointments > 0) {
        text += " " + result.upcomingBookedAppointments + " upcoming booked appointment(s) remain.";
      }
      setNotice({ type: "success", text });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
      reload();
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm("Permanently delete " + doctor.name + "? This cannot be undone.")) return;

    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      await deleteDoctor(doctor.id);
      setNotice({ type: "success", text: "Doctor deleted." });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusy(false);
      reload();
    }
  };

  const noSpecialties = data && data.specialties.length === 0;

  return (
    <div className="page-container">
      <Link to="/admin" className="back-link">
        ← Dashboard
      </Link>

      <div className="page-header-row">
        <div>
          <h1>Manage Doctors</h1>
          <p className="page-subtitle">
            Add doctors, set their weekly hours, and deactivate those who no longer take bookings.
          </p>
        </div>
        {data && formDoctor === undefined && (
          <button
            type="button"
            className="primary-button"
            disabled={noSpecialties}
            onClick={() => setFormDoctor(null)}
          >
            Add doctor
          </button>
        )}
      </div>

      {noSpecialties && (
        <Alert
          type="error"
          message="Create at least one specialty first (Dashboard, Manage specialties)."
        />
      )}

      <Alert type={notice.type} message={notice.text} />

      {data && formDoctor !== undefined && (
        <DoctorForm
          key={formDoctor ? formDoctor.id : "new"}
          specialties={data.specialties}
          doctor={formDoctor}
          onSaved={handleSaved}
          onCancel={() => setFormDoctor(undefined)}
        />
      )}

      <PageState loading={loading} error={error} onRetry={reload} />

      {data && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Working hours</th>
                <th>Appointments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.doctors.map((d) => (
                <tr key={d.id} className={d.isActive ? "" : "inactive-row"}>
                  <td>
                    <strong>{d.name}</strong>
                    <span className="cell-sub">{d.specialty.name}</span>
                  </td>
                  <td>{formatWorkingHours(d.workingHours)}</td>
                  <td>{d.appointmentCount}</td>
                  <td>{d.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="small-button small-button-blue"
                        disabled={busy}
                        onClick={() => setFormDoctor(d)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={d.isActive ? "small-button" : "small-button small-button-blue"}
                        disabled={busy}
                        onClick={() => handleToggle(d)}
                      >
                        {d.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="small-button"
                        disabled={busy || d.appointmentCount > 0}
                        title={
                          d.appointmentCount > 0
                            ? "This doctor has appointment history. Deactivate instead."
                            : "Delete this doctor"
                        }
                        onClick={() => handleDelete(d)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDoctors;