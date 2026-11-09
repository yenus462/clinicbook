import { useState } from "react";
import Alert from "../../components/Alert";
import { createDoctor, updateDoctor, setDoctorHours } from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import { DAY_NAMES, TIME_OPTIONS, hoursToRows, rowsToHours } from "../../lib/format";
import "../Tables.css";
import "./Admin.css";

// A new doctor starts with Monday to Friday switched on
function defaultRows() {
  return hoursToRows([]).map((row) => ({
    ...row,
    enabled: row.dayOfWeek >= 1 && row.dayOfWeek <= 5,
  }));
}

// doctor = null creates a new doctor, otherwise the doctor is edited.
// The parent gives this form a new "key" when the doctor changes.
function DoctorForm({ specialties, doctor, onSaved, onCancel }) {
  const [name, setName] = useState(doctor ? doctor.name : "");
  const [description, setDescription] = useState(doctor ? doctor.description : "");
  const [specialtyId, setSpecialtyId] = useState(doctor ? String(doctor.specialty.id) : "");
  const [photoUrl, setPhotoUrl] = useState(doctor && doctor.photoUrl ? doctor.photoUrl : "");
  const [rows, setRows] = useState(doctor ? hoursToRows(doctor.workingHours) : defaultRows());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (dayOfWeek, changes) => {
    setRows(rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...changes } : row)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Quick checks for instant feedback. The server checks everything again.
    if (name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (description.trim().length < 5) return setError("Description must be at least 5 characters.");
    if (!specialtyId) return setError("Please choose a specialty.");
    for (const row of rows) {
      if (row.enabled && row.startTime >= row.endTime) {
        return setError("On " + DAY_NAMES[row.dayOfWeek] + ", the start time must be before the end time.");
      }
    }

    const details = {
      name: name.trim(),
      description: description.trim(),
      specialtyId: Number(specialtyId),
      photoUrl: photoUrl.trim() === "" ? null : photoUrl.trim(),
    };
    const workingHours = rowsToHours(rows);

    setSubmitting(true);
    try {
      if (doctor) {
        // Hours first: if they would break a booking, the server refuses and nothing changes
        await setDoctorHours(doctor.id, workingHours);
        await updateDoctor(doctor.id, details);
        onSaved("Doctor updated.");
      } else {
        await createDoctor({ ...details, workingHours });
        onSaved("Doctor added.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="doctor-form" onSubmit={handleSubmit}>
      <h2>{doctor ? "Edit " + doctor.name : "Add a doctor"}</h2>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="doctor-name">Name</label>
          <input
            id="doctor-name"
            className="admin-input"
            type="text"
            maxLength="100"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="doctor-specialty">Specialty</label>
          <select
            id="doctor-specialty"
            className="admin-select"
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
          >
            <option value="">Choose...</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="doctor-description">Description</label>
          <textarea
            id="doctor-description"
            className="admin-input"
            rows="3"
            maxLength="500"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="doctor-photo">Photo link (optional)</label>
          <input
            id="doctor-photo"
            className="admin-input"
            type="text"
            maxLength="500"
            placeholder="https://..."
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
          />
        </div>
      </div>

      <h3 style={{ marginTop: "20px" }}>Weekly working hours</h3>
      <table className="hours-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.dayOfWeek}>
              <td>
                <label>
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(event) => updateRow(row.dayOfWeek, { enabled: event.target.checked })}
                  />{" "}
                  {DAY_NAMES[row.dayOfWeek]}
                </label>
              </td>
              <td>
                <select
                  className="admin-select"
                  aria-label={DAY_NAMES[row.dayOfWeek] + " start time"}
                  disabled={!row.enabled}
                  value={row.startTime}
                  onChange={(event) => updateRow(row.dayOfWeek, { startTime: event.target.value })}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
              <td>to</td>
              <td>
                <select
                  className="admin-select"
                  aria-label={DAY_NAMES[row.dayOfWeek] + " end time"}
                  disabled={!row.enabled}
                  value={row.endTime}
                  onChange={(event) => updateRow(row.dayOfWeek, { endTime: event.target.value })}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Alert type="error" message={error} />

      <div className="panel-actions">
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Saving..." : doctor ? "Save changes" : "Add doctor"}
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default DoctorForm;