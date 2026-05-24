interface StatusBarProps {
  documentName?: string;
  isUnsaved?: boolean;
  isSyncing?: boolean;
}

export function StatusBar({ documentName, isUnsaved, isSyncing }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">{documentName || 'Untitled'}</span>
        {isUnsaved && <span className="status-unsaved">● unsaved</span>}
        {isSyncing && <span className="status-syncing">⟳ syncing</span>}
      </div>
      <div className="status-right">
        <span className="status-item" style={{ fontSize: '11px', color: '#008800' }}>
          Ctrl+K for commands
        </span>
      </div>
    </div>
  );
}
