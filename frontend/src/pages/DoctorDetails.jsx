import { useParams, Link } from "react-router-dom";
import "./DoctorDetails.css";

// Sample data. In Stage 9 this will come from the backend.
const sampleDoctors = [
  {
    id: 1,
    name: "Dr. Sara Ahmed",
    specialty: "General Practitioner",
    description: "Family health, check-ups, and common illnesses.",
    days: "Monday to Friday, 09:00 to 16:00",
  },
  {
    id: 2,
    name: "Dr. Daniel Bekele",
    specialty: "Cardiologist",
    description: "Heart health, blood pressure, and chest pain.",
    days: "Monday, Wednesday, Friday, 10:00 to 15:00",
  },
  {
    id: 3,
    name: "Dr. Hanna Tesfaye",
    specialty: "Pediatrician",
    description: "Health care for babies, children, and teenagers.",
    days: "Tuesday and Thursday, 09:00 to 14:00",
  },
  {
    id: 4,
    name: "Dr. Samuel Girma",
    specialty: "Dermatologist",
    description: "Skin, hair, and nail conditions.",
    days: "Monday to Thursday, 11:00 to 17:00",
  },
];

function DoctorDetails() {
  // Read the number from the address, for example /doctors/2 gives id = "2"
  const { id } = useParams();

  // Find the doctor whose id matches. Number(id) turns the text "2" into the number 2
  const doctor = sampleDoctors.find((d) => d.id === Number(id));

  if (!doctor) {
    return (
      <div className="doctor-details">
        <h1>Doctor not found</h1>
        <Link to="/doctors">Back to doctors</Link>
      </div>
    );
  }

  return (
    <div className="doctor-details">
      <Link to="/doctors">← Back to doctors</Link>

      <div className="doctor-details-card">
        <h1>{doctor.name}</h1>
        <p className="doctor-details-specialty">{doctor.specialty}</p>
        <p>{doctor.description}</p>
        <p>
          <strong>Working hours:</strong> {doctor.days}
        </p>
      </div>

      <div className="doctor-details-card">
        <h2>Available times</h2>
        <p>Date and time selection will be added here in a later task.</p>
      </div>
    </div>
  );
}

export default DoctorDetails;