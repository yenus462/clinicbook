import { Link } from "react-router-dom";
import { sampleAppointments, sampleAdminDoctors } from "../../data/sampleData";
import "../Tables.css";
import "./Admin.css";

function AdminDashboard() {
  // Count appointments by status
  const countByStatus = (status) =>
    sampleAppointments.filter((a) => a.status === status).length;

  const stats = [
    { label: "Total appointments", value: sampleAppointments.length },
    { label: "Booked", value: countByStatus("BOOKED") },
    { label: "Completed", value: countByStatus("COMPLETED") },
    { label: "Cancelled", value: countByStatus("CANCELLED") },
    {
      label: "Active doctors",
      value: sampleAdminDoctors.filter((d) => d.active).length,
    },
  ];

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">A quick overview of the clinic.</p>

      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-number">{s.value}</div>
            <div>{s.label}</div>
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
      </div>
    </div>
  );
}

export default AdminDashboard;