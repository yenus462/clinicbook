import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Home.css";

const STEPS = [
  {
    title: "1. Choose a doctor",
    text: "Browse our doctors by specialty and read about their working hours.",
  },
  {
    title: "2. Pick a free time",
    text: "Select a date within the next 30 days and a 30-minute slot that is really free.",
  },
  {
    title: "3. Book in seconds",
    text: "Add a short reason and confirm. You can reschedule or cancel from your account.",
  },
];

function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="home-hero">
        <h1>Book your clinic appointment online</h1>
        <p>
          Find a doctor, choose a free time, and book in a few clicks. No phone calls and no
          waiting in line.
        </p>

        <div className="home-actions">
          <Link to="/doctors" className="home-button">
            Find a Doctor
          </Link>

          {!user && (
            <Link to="/register" className="home-link">
              Create a free account
            </Link>
          )}
          {user && user.role === "PATIENT" && (
            <Link to="/my-appointments" className="home-link">
              My appointments
            </Link>
          )}
          {user && user.role === "ADMIN" && (
            <Link to="/admin" className="home-link">
              Open the admin dashboard
            </Link>
          )}
        </div>
      </section>

      <section className="home-steps" aria-labelledby="how-it-works">
        <h2 id="how-it-works">How it works</h2>
        <div className="home-steps-grid">
          {STEPS.map((step) => (
            <div className="home-step" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;