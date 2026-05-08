import { resolveAssetUrl } from "../services/apiClient";

function ScreenshotModal({ isOpen, imageUrl, onClose, title = "Screenshot" }) {
  if (!isOpen || !imageUrl) return null;

  const resolvedUrl = resolveAssetUrl(imageUrl);

  return (
    <div className="proof-modal-overlay" onClick={onClose}>
      <div className="proof-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="title-row">
          <h3>{title}</h3>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <img
            src={resolvedUrl}
            alt={title}
            className="proof-modal-image"
            onError={(e) => {
              e.target.alt = "Unable to load image";
              e.target.style.color = "#999";
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScreenshotModal;
