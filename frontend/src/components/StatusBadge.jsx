import "./StatusBadge.css";

// A small coloured label that shows an appointment status
function StatusBadge({ status }) {
  return (
    <span className={"badge badge-" + status.toLowerCase()}>{status}</span>
  );
}

export default StatusBadge;