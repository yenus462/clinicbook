import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useFetch } from "../hooks/useFetch";
import { fetchDoctors, fetchSpecialties } from "../api/doctors";
import { specialtyIcon } from "../lib/specialtyIcon";
import Icon from "../components/Icons";
import DoctorCard from "../components/DoctorCard";
import PageState from "../components/PageState";
import "./Home.css";

const STEPS = [
  {
    icon: "search",
    title: "Choose a doctor",
    text: "Browse specialists by specialty and read about their working hours.",
  },
  {
    icon: "calendar",
    title: "Pick a free time",
    text: "Select a date within 30 days and a 30-minute slot that is really free.",
  },
  {
    icon: "check",
    title: "Confirm your visit",
    text: "Add a short reason and book. Manage everything from your account.",
  },
];

const REASONS = [
  {
    icon: "clock",
    title: "Live availability",
    text: "You only see times that are truly free, so there are no double bookings.",
  },
  {
    icon: "calendar",
    title: "Reschedule or cancel online",
    text: "Plans change. Move or cancel a visit from your account, up to 2 hours before.",
  },
  {
    icon: "shield",
    title: "Private and secure",
    text: "Passwords are encrypted, and your appointments are visible only to you.",
  },
  {
    icon: "users",
    title: "Everything in one place",
    text: "See your upcoming and past visits and their status at a glance.",
  },
];

// A small illustration of the booking screen (decorative)
function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-blob" />
      <div className="hero-card">
        <div className="hero-card-head">
          <span className="hero-card-icon">
            <Icon name="calendar" size={20} />
          </span>
          <div>
            <strong>Choose a time</strong>
            <small>Free slots for your doctor</small>
          </div>
        </div>
        <div className="hero-slots">
          <span>09:00</span>
          <span className="on">09:30</span>
          <span>10:00</span>
          <span>10:30</span>
          <span>11:00</span>
          <span>11:30</span>
        </div>
        <div className="hero-card-btn">Confirm booking</div>
      </div>
      <div className="hero-chip hero-chip-top">
        <Icon name="check" size={16} /> Appointment confirmed
      </div>
      <div className="hero-chip hero-chip-bottom">
        <Icon name="clock" size={16} /> 30-minute visits
      </div>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const doctorsState = useFetch(fetchDoctors);
  const specialtiesState = useFetch(fetchSpecialties);

  const doctors = doctorsState.data;
  const specialties = specialtiesState.data;

  // How many doctors each specialty has, so empty specialties are hidden
  const counts = {};
  if (doctors) {
    for (const doctor of doctors) {
      counts[doctor.specialty.id] = (counts[doctor.specialty.id] || 0) + 1;
    }
  }
  const visibleSpecialties = specialties && doctors ? specialties.filter((s) => counts[s.id]) : [];

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text fade-up">
            <span className="hero-badge">Online appointment booking</span>
            <h1>Your health, scheduled in minutes</h1>
            <p>
              Find a trusted doctor, choose a free time and book online. No phone calls, no
              waiting in line.
            </p>

            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-primary">
                Find a Doctor
                <Icon name="arrow" size={18} />
              </Link>
              {!user && (
                <Link to="/register" className="btn btn-outline">
                  Create free account
                </Link>
              )}
              {user && user.role === "PATIENT" && (
                <Link to="/my-appointments" className="btn btn-outline">
                  My appointments
                </Link>
              )}
              {user && user.role === "ADMIN" && (
                <Link to="/admin" className="btn btn-outline">
                  Admin dashboard
                </Link>
              )}
            </div>

            <ul className="hero-points">
              <li>
                <Icon name="check" size={16} /> Real-time availability
              </li>
              <li>
                <Icon name="check" size={16} /> Free to use
              </li>
              <li>
                <Icon name="check" size={16} /> Reschedule or cancel online
              </li>
            </ul>
          </div>

          <HeroArt />
        </div>
      </section>

      {/* Specialties */}
      <section className="section" aria-labelledby="specialties-title">
        <h2 id="specialties-title" className="section-title">
          Browse by specialty
        </h2>
        <p className="section-sub">Choose the type of care you need.</p>

        <PageState
          loading={specialtiesState.loading || doctorsState.loading}
          error={specialtiesState.error || doctorsState.error}
          onRetry={() => {
            specialtiesState.reload();
            doctorsState.reload();
          }}
        />

        <div className="specialty-grid">
          {visibleSpecialties.map((s) => (
            <Link key={s.id} to={"/doctors?specialty=" + s.id} className="specialty-card">
              <span className="specialty-icon">
                <Icon name={specialtyIcon(s.name)} size={26} />
              </span>
              <h3>{s.name}</h3>
              <p>
                {counts[s.id]} {counts[s.id] === 1 ? "doctor" : "doctors"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured doctors */}
      {doctors && doctors.length > 0 && (
        <section className="section" aria-labelledby="doctors-title">
          <div className="section-row">
            <div>
              <h2 id="doctors-title" className="section-title">
                Meet our doctors
              </h2>
              <p className="section-sub">Experienced specialists, ready when you are.</p>
            </div>
            <Link to="/doctors" className="section-link">
              View all doctors →
            </Link>
          </div>

          <div className="featured-grid">
            {doctors.slice(0, 3).map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="section" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="section-title center">
          How it works
        </h2>
        <p className="section-sub center">Three simple steps to your appointment.</p>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <div className="step-card" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <span className="step-icon">
                <Icon name={step.icon} size={26} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose ClinicBook */}
      <section className="why" aria-labelledby="why-title">
        <div className="why-inner">
          <h2 id="why-title" className="section-title center">
            Why choose ClinicBook
          </h2>
          <p className="section-sub center">Booking care should be simple and reliable.</p>

          <div className="why-grid">
            {REASONS.map((reason) => (
              <div className="why-card" key={reason.title}>
                <span className="why-icon">
                  <Icon name={reason.icon} size={24} />
                </span>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="cta">
        <div className="cta-inner">
          <h2>Ready to book your appointment?</h2>
          <p>Find a doctor and choose a time that suits you.</p>
          <Link to="/doctors" className="btn btn-light">
            Book Appointment
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;