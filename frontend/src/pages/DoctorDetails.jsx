import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { fetchDoctor } from "../api/doctors";
import { formatWorkingHours } from "../lib/format";
import PageState from "../components/PageState";
import BookingSection from "../components/BookingSection";
import "./DoctorDetails.css";

function DoctorDetails() {
  const { id } = useParams();
  const request = useCallback(() => fetchDoctor(id), [id]);
  const { data: doctor, loading, error, reload } = useFetch(request);

  if (loading || error) {
    return (
      <div className="doctor-details">
        <Link to="/doctors">← Back to doctors</Link>
        <PageState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="doctor-details">
      <Link to="/doctors">← Back to doctors</Link>

      <div className="doctor-details-card">
        <h1>{doctor.name}</h1>
        <p className="doctor-details-specialty">{doctor.specialty.name}</p>
        <p>{doctor.description}</p>
        <p>
          <strong>Working hours:</strong> {formatWorkingHours(doctor.workingHours)}
        </p>
      </div>

      <BookingSection doctorId={doctor.id} />
    </div>
  );
}

export default DoctorDetails;