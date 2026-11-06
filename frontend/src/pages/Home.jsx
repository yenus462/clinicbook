import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <h1>Book your clinic appointment online</h1>
      <p>
        Find a doctor, choose a free time, and book in a few clicks. No phone
        calls and no waiting in line.
      </p>
      <Link to="/doctors" className="home-button">
        Find a Doctor
      </Link>
    </div>
  );
}

export default Home;