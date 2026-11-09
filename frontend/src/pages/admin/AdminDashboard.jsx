import { Link } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { fetchStats } from "../../api/admin";
import PageState from "../../components/PageState";
import "../Tables.css";
import "./Admin.css";

function AdminDashboard() {
  const { data: stats, loading, error, reload } = useFetch(fetchStats);

  const cards = stats
    ? [
        { label: "Total appointments", value: stats.total },
        { label: "Booked", value: stats.byStatus.BOOKED },
        { label: "Completed", value: stats.byStatus.COMPLETED },
        { label: "Cancelled", value: stats.byStatus.CANCELLED },
        { label: "Booked for today", value: stats.bookedToday },
        { label: "Upcoming booked", value: stats.upcomingBooked },
        { label: "Active doctors", value: stats.activeDoctors },
        { label: "Registered patients", value: stats.patients },
      ]
    : [];

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">A quick overview of the clinic.</p>

      <PageState loading={loading} error={error} onRetry={reload} />

      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-number">{card.value}</div>
            <div>{card.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-links">
        <Link to="/admin/appointments" className="admin-link-button">
          Manage appointments
        </Link>
        <Link to="/admin/doctors" className="admin-link-button">
          Manage doctors
        </Link>
        <Link to="/admin/specialties" className="admin-link-button">
          Manage specialties
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;