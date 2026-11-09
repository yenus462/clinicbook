import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { fetchDoctors } from "../api/doctors";
import { formatWorkingHours } from "../lib/format";
import PageState from "../components/PageState";
import "./Doctors.css";

function Doctors() {
  const { data: doctors, loading, error, reload } = useFetch(fetchDoctors);
  const [specialtyId, setSpecialtyId] = useState("");
  const [search, setSearch] = useState("");

  // The specialty choices come from the doctors themselves
  const specialties = [];
  if (doctors) {
    for (const doctor of doctors) {
      if (!specialties.some((s) => s.id === doctor.specialty.id)) {
        specialties.push(doctor.specialty);
      }
    }
    specialties.sort((a, b) => a.name.localeCompare(b.name));
  }

  const term = search.trim().toLowerCase();
  const visible = doctors
    ? doctors.filter(
        (d) =>
          (specialtyId === "" || String(d.specialty.id) === specialtyId) &&
          d.name.toLowerCase().includes(term)
      )
    : [];

  return (
    <div className="doctors">
      <h1>Our Doctors</h1>
      <p className="doctors-subtitle">Choose a doctor to see their available times.</p>

      {doctors && (
        <div className="doctors-filters">
          <input
            type="text"
            className="doctors-search"
            placeholder="Search by name"
            aria-label="Search doctors by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="doctors-select"
            aria-label="Filter by specialty"
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <PageState loading={loading} error={error} onRetry={reload} />

      {doctors && visible.length === 0 && (
        <p>No doctors match your search. Try another name or specialty.</p>
      )}

      <div className="doctors-grid">
        {visible.map((doctor) => (
          <div className="doctor-card" key={doctor.id}>
            <h3>{doctor.name}</h3>
            <p className="doctor-specialty">{doctor.specialty.name}</p>
            <p>{doctor.description}</p>
            <p className="doctor-hours">{formatWorkingHours(doctor.workingHours)}</p>
            <Link to={"/doctors/" + doctor.id} className="doctor-button">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Doctors;