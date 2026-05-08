function AlertMessage({ type = "info", message }) {
  if (!message) return null;

  const className =
    type === "error"
      ? "alert alert-error"
      : type === "success"
      ? "alert alert-success"
      : "alert alert-info";

  return <div className={className}>{message}</div>;
}

export default AlertMessage;
