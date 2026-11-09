import "./PageState.css";

// A coloured message box. type is "error" or "success". Empty message shows nothing.
function Alert({ type = "error", message }) {
  if (!message) return null;

  return (
    <p className={"alert alert-" + type} role={type === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}

export default Alert;