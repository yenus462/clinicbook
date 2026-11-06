import { useState } from "react";
import { Link } from "react-router-dom";
import "./Form.css";

function Login() {
  // State: React remembers what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Runs when the user clicks the Login button
  const handleSubmit = (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    console.log("Login form submitted:", { email, password });
  };

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" className="form-button">
          Login
        </button>

        <p className="form-footer">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;