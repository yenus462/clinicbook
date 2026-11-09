import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { getErrorMessage } from "../api/client";
import Alert from "../components/Alert";
import "./Form.css";

const PHONE_REGEX = /^[0-9+\-\s]{7,15}$/;

function Profile() {
  // This page is wrapped in ProtectedRoute, so user is always set here
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");

    // Quick checks for instant feedback. The backend checks everything again.
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setError("Phone must be 7 to 15 digits (you may use + - and spaces).");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const updated = await updateProfile(name.trim(), phone.trim());
      setName(updated.name);
      setPhone(updated.phone || "");
      setSuccess("Your profile was saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>My profile</h1>

        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" type="email" value={user.email} disabled />

        <label htmlFor="profile-role">Account type</label>
        <input
          id="profile-role"
          type="text"
          value={user.role === "ADMIN" ? "Administrator" : "Patient"}
          disabled
        />

        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          maxLength="100"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="profile-phone">Phone</label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          maxLength="15"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <button type="submit" className="form-button" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

export default Profile;