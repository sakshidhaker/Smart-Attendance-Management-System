import Modal from "./Modal";

export default function ConfirmModal({ open, title = "Are you sure?", message, confirmText = "Delete", loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button className="btn danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Please wait..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
