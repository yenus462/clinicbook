import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import DoctorDetails from "./pages/DoctorDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyAppointments from "./pages/MyAppointments";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminSpecialties from "./pages/admin/AdminSpecialties";

const TITLES = {
  "/": "Book clinic appointments online",
  "/doctors": "Our doctors",
  "/login": "Login",
  "/register": "Create an account",
  "/profile": "My profile",
  "/my-appointments": "My appointments",
  "/admin": "Admin dashboard",
  "/admin/appointments": "All appointments",
  "/admin/doctors": "Manage doctors",
  "/admin/specialties": "Manage specialties",
};

// Sets the browser tab title from the current address
function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = TITLES[pathname];
    if (!title) {
      title = pathname.startsWith("/doctors/") ? "Doctor details" : "Page not found";
    }
    document.title = title + " | ClinicBook";
  }, [pathname]);

  return null;
}

function App() {
  return (
    <div className="app-shell">
      <RouteTitle />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />

      <main id="main-content" className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute role="PATIENT">
                <MyAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/specialties"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminSpecialties />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;