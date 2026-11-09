import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { fetchDoctors } from "../api/doctors";
import PageState from "../components/PageState";
import DoctorCard from "../components/DoctorCard";
import Icon from "../components/Icons";
import "./Doctors.css";

function Doctors() {
  const { data: doctors, loading, error, reload } = useFetch(fetchDoctors);

  // The Home page links here with ?specialty=<id>
  const [searchParams] = useSearchParams();
  const [specialtyId, setSpecialtyId] = useState(searchParams.get("specialty") || "");
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
    <div>
      <section className="doctors-hero">
        <div className="doctors-hero-inner">
          <h1>Find your doctor</h1>
          <p>Browse our specialists and book a free time in a few clicks.</p>

          {doctors && (
            <div className="doctors-filters">
              <div className="doctors-search-box">
                <Icon name="search" size={18} />
                <input
                  type="text"
                  className="doctors-search"
                  placeholder="Search by doctor name"
                  aria-label="Search doctors by name"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
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
        </div>
      </section>

      <div className="doctors">
        <PageState loading={loading} error={error} onRetry={reload} />

        {doctors && (
          <p className="doctors-count">
            {visible.length} {visible.length === 1 ? "doctor" : "doctors"} available
          </p>
        )}

        {doctors && visible.length === 0 && (
          <p className="doctors-empty">
            No doctors match your search. Try another name or specialty.
          </p>
        )}

        <div className="doctors-grid">
          {visible.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Doctors;