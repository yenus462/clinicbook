import "./Doctors.css";

// Sample data. In Stage 9 this will come from the backend.
const sampleDoctors = [
  {
    id: 1,
    name: "Dr. Sara Ahmed",
    specialty: "General Practitioner",
    description: "Family health, check-ups, and common illnesses.",
  },
  {
    id: 2,
    name: "Dr. Daniel Bekele",
    specialty: "Cardiologist",
    description: "Heart health, blood pressure, and chest pain.",
  },
  {
    id: 3,
    name: "Dr. Hanna Tesfaye",
    specialty: "Pediatrician",
    description: "Health care for babies, children, and teenagers.",
  },
  {
    id: 4,
    name: "Dr. Samuel Girma",
    specialty: "Dermatologist",
    description: "Skin, hair, and nail conditions.",
  },
];

function Doctors() {
  return (
    <div className="doctors">
      <h1>Our Doctors</h1>
      <p className="doctors-subtitle">Choose a doctor to see their available times.</p>

      <div className="doctors-grid">
        {sampleDoctors.map((doctor) => (
          <div className="doctor-card" key={doctor.id}>
            <h3>{doctor.name}</h3>
            <p className="doctor-specialty">{doctor.specialty}</p>
            <p>{doctor.description}</p>
            <button className="doctor-button">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Doctors;