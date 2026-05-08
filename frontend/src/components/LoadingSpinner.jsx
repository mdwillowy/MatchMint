function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <span className="loading-spinner" />
      <p className="muted">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
