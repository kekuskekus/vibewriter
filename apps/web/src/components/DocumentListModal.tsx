import { useEffect, useState } from 'react';
import { Document, DocumentMeta } from '@focus-writer/shared';
import { apiClient } from '../utils/api';

interface DocumentListModalProps {
  onSelectDocument: (doc: Document) => void;
  onClose: () => void;
}

export function DocumentListModal({ onSelectDocument, onClose }: DocumentListModalProps) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      const docs = await apiClient.listDocuments();
      setDocuments(docs);
      setLoading(false);
    }

    loadDocuments();
  }, []);

  const handleSelectAndOpen = async (doc: DocumentMeta) => {
    const fullDoc = await apiClient.getDocument(doc.id);
    if (fullDoc) {
      onSelectDocument(fullDoc);
    }
  };

  const handleCreateNew = async () => {
    const newDoc = await apiClient.createDocument('Untitled');
    if (newDoc) {
      onSelectDocument(newDoc);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Open Document</h2>

        <button
          onClick={handleCreateNew}
          style={{
            marginBottom: '20px',
            backgroundColor: '#001100',
            fontWeight: 'bold',
          }}
        >
          + New Document
        </button>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents yet. Create one to get started.</p>
        ) : (
          <ul className="document-list">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="document-list-item"
                onClick={() => handleSelectAndOpen(doc)}
                style={{
                  backgroundColor: selectedId === doc.id ? '#001100' : 'transparent',
                }}
              >
                <div className="document-list-item-title">{doc.name}</div>
                <div className="document-list-item-meta">
                  Updated: {new Date(doc.updatedAt).toLocaleDateString()} •{' '}
                  {new Date(doc.updatedAt).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #003300' }}>
          <button onClick={onClose} style={{ backgroundColor: '#1a0000', borderColor: '#ff4444' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
