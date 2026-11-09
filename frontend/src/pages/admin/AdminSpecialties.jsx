import { useState } from "react";
import { Link } from "react-router-dom";
import PageState from "../../components/PageState";
import Alert from "../../components/Alert";
import { useFetch } from "../../hooks/useFetch";
import {
  fetchAdminSpecialties,
  createSpecialty,
  renameSpecialty,
  deleteSpecialty,
} from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import "../Tables.css";
import "./Admin.css";

function AdminSpecialties() {
  const { data: specialties, loading, error, reload } = useFetch(fetchAdminSpecialties);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [notice, setNotice] = useState({ type: "success", text: "" });
  const [busy, setBusy] = useState(false);

  // Runs one action, shows the result, and reloads the list. Returns true on success.
  const run = async (action, successText) => {
    setBusy(true);
    setNotice({ type: "success", text: "" });
    try {
      await action();
      setNotice({ type: "success", text: successText });
      reload();
      return true;
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (newName.trim().length < 2) {
      setNotice({ type: "error", text: "Specialty name must be at least 2 characters." });
      return;
    }
    if (await run(() => createSpecialty(newName.trim()), "Specialty added.")) {
      setNewName("");
    }
  };

  const startEdit = (specialty) => {
    setEditingId(specialty.id);
    setEditName(specialty.name);
  };

  const handleRename = async (id) => {
    if (await run(() => renameSpecialty(id, editName.trim()), "Specialty renamed.")) {
      setEditingId(null);
    }
  };

  const handleDelete = async (specialty) => {
    if (!window.confirm('Delete the specialty "' + specialty.name + '"?')) return;
    await run(() => deleteSpecialty(specialty.id), "Specialty deleted.");
  };

  return (
    <div className="page-container">
      <Link to="/admin" className="back-link">
        ← Dashboard
      </Link>
      <h1>Manage Specialties</h1>
      <p className="page-subtitle">A specialty can only be deleted when no doctor uses it.</p>

      <form className="add-row-form" onSubmit={handleAdd}>
        <input
          className="admin-input"
          type="text"
          placeholder="New specialty name"
          maxLength="60"
          aria-label="New specialty name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <button type="submit" className="primary-button" disabled={busy}>
          Add specialty
        </button>
      </form>

      <Alert type={notice.type} message={notice.text} />
      <PageState loading={loading} error={error} onRetry={reload} />

      {specialties && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Doctors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialties.map((s) => (
                <tr key={s.id}>
                  <td>
                    {editingId === s.id ? (
                      <input
                        className="admin-input"
                        type="text"
                        maxLength="60"
                        aria-label="Specialty name"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                      />
                    ) : (
                      s.name
                    )}
                  </td>
                  <td>{s.doctorCount}</td>
                  <td>
                    {editingId === s.id ? (
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-button small-button-blue"
                          disabled={busy}
                          onClick={() => handleRename(s.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="small-button small-button-blue"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="action-group">
                        <button
                          type="button"
                          className="small-button small-button-blue"
                          disabled={busy}
                          onClick={() => startEdit(s)}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="small-button"
                          disabled={busy || s.doctorCount > 0}
                          title={
                            s.doctorCount > 0
                              ? "This specialty still has doctors."
                              : "Delete this specialty"
                          }
                          onClick={() => handleDelete(s)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminSpecialties;