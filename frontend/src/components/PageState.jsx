import "./PageState.css";

// Shows "Loading..." or an error with a "Try again" button.
// Shows nothing when there is neither.
function PageState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <p className="page-state" role="status">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <div className="page-state page-state-error" role="alert">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="retry-button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  return null;
}

export default PageState;