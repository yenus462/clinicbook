import { Link } from "react-router-dom";
import DoctorAvatar from "./DoctorAvatar";
import Icon from "./Icons";
import { formatWorkingHours } from "../lib/format";
import "./DoctorCard.css";

// One doctor, as shown on the Home and Doctors pages
function DoctorCard({ doctor }) {
  return (
    <article className="dcard">
      <div className="dcard-top">
        <DoctorAvatar doctor={doctor} />
        <div>
          <h3>{doctor.name}</h3>
          <p className="dcard-specialty">{doctor.specialty.name}</p>
        </div>
      </div>

      <p className="dcard-desc">{doctor.description}</p>

      <p className="dcard-hours">
        <Icon name="clock" size={16} />
        <span>{formatWorkingHours(doctor.workingHours)}</span>
      </p>

      <Link to={"/doctors/" + doctor.id} className="dcard-button">
        Book appointment
        <Icon name="arrow" size={16} />
      </Link>
    </article>
  );
}

export default DoctorCard;