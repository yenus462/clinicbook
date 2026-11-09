import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { SITE } from "../lib/siteInfo";
import Logo from "./Logo";
import Icon from "./Icons";
import "./Footer.css";

function Footer() {
  const { user } = useAuth();
  const hasContact = SITE.address || SITE.email || SITE.phone;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo light />
          <p>{SITE.tagline}</p>
          <p className="footer-muted">
            Find a doctor, choose a free time and manage your visits online.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/doctors">Find a doctor</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Your account</h3>
          <ul>
            {!user && (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Create an account</Link>
                </li>
              </>
            )}
            {user && user.role === "PATIENT" && (
              <li>
                <Link to="/my-appointments">My appointments</Link>
              </li>
            )}
            {user && user.role === "ADMIN" && (
              <li>
                <Link to="/admin">Admin dashboard</Link>
              </li>
            )}
            {user && (
              <li>
                <Link to="/profile">My profile</Link>
              </li>
            )}
          </ul>
        </div>

        {hasContact && (
          <div>
            <h3>Contact</h3>
            <ul>
              {SITE.address && (
                <li className="footer-contact">
                  <Icon name="pin" size={16} /> {SITE.address}
                </li>
              )}
              {SITE.email && (
                <li className="footer-contact">
                  <Icon name="mail" size={16} />
                  <a href={"mailto:" + SITE.email}>{SITE.email}</a>
                </li>
              )}
              {SITE.phone && (
                <li className="footer-contact">
                  <a href={"tel:" + SITE.phone.replace(/\s/g, "")}>{SITE.phone}</a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;