import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { fetchDoctor } from "../api/doctors";
import { formatWorkingHours } from "../lib/format";
import PageState from "../components/PageState";
import BookingSection from "../components/BookingSection";
import DoctorAvatar from "../components/DoctorAvatar";
import Icon from "../components/Icons";
import "./DoctorDetails.css";

function DoctorDetails() {
  const { id } = useParams();
  const request = useCallback(() => fetchDoctor(id), [id]);
  const { data: doctor, loading, error, reload } = useFetch(request);

  if (loading || error) {
    return (
      <div className="doctor-details">
        <Link to="/doctors" className="doctor-back">
          ← Back to doctors
        </Link>
        <PageState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="doctor-details">
      <Link to="/doctors" className="doctor-back">
        ← Back to doctors
      </Link>

      <div className="doctor-details-layout">
        <aside className="doctor-profile">
          <DoctorAvatar doctor={doctor} size="lg" />
          <h1>{doctor.name}</h1>
          <p className="doctor-details-specialty">{doctor.specialty.name}</p>
          <p className="doctor-profile-text">{doctor.description}</p>

          <div className="doctor-profile-hours">
            <Icon name="clock" size={18} />
            <div>
              <strong>Working hours</strong>
              <p>{formatWorkingHours(doctor.workingHours)}</p>
            </div>
          </div>

          <ul className="doctor-profile-facts">
            <li>
              <Icon name="check" size={16} /> 30-minute appointments
            </li>
            <li>
              <Icon name="check" size={16} /> Reschedule or cancel online
            </li>
          </ul>
        </aside>

        <BookingSection doctorId={doctor.id} />
      </div>
    </div>
  );
}

export default DoctorDetails;