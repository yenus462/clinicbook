import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Logo from "./Logo";
import "./Navbar.css";

// NavLink adds the class "active" to the link of the current page
const linkClass = ({ isActive }) => (isActive ? "active" : undefined);

function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/");
  };

  const isAdmin = user && user.role === "ADMIN";

  return (
    <nav className="navbar" aria-label="Main">
      <Link to="/" className="navbar-brand" onClick={closeMenu} aria-label="ClinicBook home">
        <Logo />
      </Link>

      <button
        type="button"
        className="navbar-toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <div id="nav-links" className={open ? "navbar-links open" : "navbar-links"}>
        <NavLink to="/" end className={linkClass} onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink to="/doctors" className={linkClass} onClick={closeMenu}>
          Doctors
        </NavLink>

        {user && user.role === "PATIENT" && (
          <NavLink to="/my-appointments" className={linkClass} onClick={closeMenu}>
            My Appointments
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
            Admin
          </NavLink>
        )}

        {!loading && !user && (
          <>
            <NavLink to="/login" className={linkClass} onClick={closeMenu}>
              Login
            </NavLink>
            <NavLink to="/register" className={linkClass} onClick={closeMenu}>
              Register
            </NavLink>
          </>
        )}

        {user && (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) => "navbar-user" + (isActive ? " active" : "")}
              onClick={closeMenu}
            >
              {user.name}
            </NavLink>
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

        {!isAdmin && (
          <Link to="/doctors" className="navbar-cta" onClick={closeMenu}>
            Book Appointment
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;