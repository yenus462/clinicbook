import { useState } from "react";
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

// Sample 30-minute slots. In Stage 8 the backend will calculate the free ones.
const sampleSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
];

// Today's date as text like "2026-11-07", used as the earliest allowed date
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function DoctorDetails() {
  const { id } = useParams();
  const doctor = sampleDoctors.find((d) => d.id === Number(id));

  // State: the chosen date and the chosen time slot
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  if (!doctor) {
    return (
      <div className="doctor-details">
        <h1>Doctor not found</h1>
        <Link to="/doctors">Back to doctors</Link>
      </div>
    );
  }

  // When the date changes, clear the chosen slot
  const handleDateChange = (event) => {
    setDate(event.target.value);
    setSelectedSlot("");
  };

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
        <h2>Book an appointment</h2>

        <label htmlFor="date" className="booking-label">
          Choose a date
        </label>
        <input
          id="date"
          type="date"
          className="booking-date"
          min={getToday()}
          value={date}
          onChange={handleDateChange}
        />

        {date && (
          <div>
            <p className="booking-label">Available times on {date}</p>
            <div className="slot-grid">
              {sampleSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={
                    slot === selectedSlot ? "slot-button slot-selected" : "slot-button"
                  }
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {date && selectedSlot && (
          <p className="booking-summary">
            You selected {date} at {selectedSlot}.
          </p>
        )}
      </div>
    </div>
  );
}

export default DoctorDetails;