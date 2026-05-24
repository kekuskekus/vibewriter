interface ExportModalProps {
  onExport: (format: 'md' | 'odt') => void;
  onClose: () => void;
}

export function ExportModal({ onExport, onClose }: ExportModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Export Document</h2>

        <button onClick={() => onExport('md')} style={{ marginBottom: '10px' }}>
          Export as Markdown (.md)
        </button>

        <button onClick={() => onExport('odt')} style={{ marginBottom: '20px' }}>
          Export as ODT (.odt)
        </button>

        <button onClick={onClose} style={{ backgroundColor: '#1a0000', borderColor: '#ff4444' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
