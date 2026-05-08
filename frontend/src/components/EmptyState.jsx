function EmptyState({ title = "Nothing to show", subtitle = "Try again later." }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <p className="muted">{subtitle}</p>
    </div>
  );
}

export default EmptyState;
