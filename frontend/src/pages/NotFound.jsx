import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="not-found">
      <p className="not-found-code">404</p>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or was moved.</p>
      <div className="not-found-actions">
        <Link to="/" className="not-found-button">
          Go to home
        </Link>
        <Link to="/doctors" className="not-found-link">
          Find a doctor
        </Link>
      </div>
    </div>
  );
}

export default NotFound;