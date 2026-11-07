import { useState } from "react";
import { sampleAdminDoctors } from "../../data/sampleData";
import "../Tables.css";
import "./Admin.css";

function AdminDoctors() {
  const [doctors, setDoctors] = useState(sampleAdminDoctors);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState("");

  const handleAdd = (event) => {
    event.preventDefault();

    if (name.trim() === "" || specialty.trim() === "") {
      setError("Please enter both a name and a specialty.");
      return;
    }

    const newDoctor = {
      id: Date.now(), // temporary unique id; the database will create real ones
      name: name.trim(),
      specialty: specialty.trim(),
      active: true,
    };

    setDoctors([...doctors, newDoctor]);
    setName("");
    setSpecialty("");
    setError("");
  };

  // Rule 15: doctors are deactivated, never deleted, so history stays intact
  const toggleActive = (id) => {
    setDoctors(
      doctors.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    );
  };

  return (
    <div className="page-container">
      <h1>Manage Doctors</h1>
      <p className="page-subtitle">
        Add doctors, and deactivate those who no longer take bookings.
      </p>

      <form className="add-doctor-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          type="text"
          placeholder="Doctor name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="admin-input"
          type="text"
          placeholder="Specialty"
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
        />
        <button type="submit" className="add-doctor-button">
          Add doctor
        </button>
        {error && <p className="form-error-inline">{error}</p>}
      </form>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id} className={d.active ? "" : "inactive-row"}>
                <td>{d.name}</td>
                <td>{d.specialty}</td>
                <td>{d.active ? "Active" : "Inactive"}</td>
                <td>
                  <button
                    className={
                      d.active ? "small-button" : "small-button small-button-blue"
                    }
                    onClick={() => toggleActive(d.id)}
                  >
                    {d.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDoctors;