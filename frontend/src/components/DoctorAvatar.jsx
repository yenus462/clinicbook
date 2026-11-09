import { useState } from "react";
import "./DoctorAvatar.css";

// "Dr. Sara Ahmed" becomes "SA"
function initials(name) {
  const parts = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  return (((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase();
}

// Shows the doctor's photo if there is one, otherwise a coloured circle with initials
function DoctorAvatar({ doctor, size = "md" }) {
  const [failed, setFailed] = useState(false);

  if (doctor.photoUrl && !failed) {
    return (
      <img
        className={"avatar avatar-" + size}
        src={doctor.photoUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={"avatar avatar-" + size + " avatar-tone-" + (doctor.id % 4)} aria-hidden="true">
      {initials(doctor.name)}
    </span>
  );
}

export default DoctorAvatar;