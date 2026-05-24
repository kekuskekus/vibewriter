import { useState, useEffect } from 'react';
import { Document } from '@focus-writer/shared';
import { apiClient } from './utils/api';
import { Editor } from './components/Editor';
import { AuthDialog } from './components/AuthDialog';
import { DocumentListModal } from './components/DocumentListModal';
import { ExportModal } from './components/ExportModal';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';

export function App() {
  const [authRequired, setAuthRequired] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize app
  useEffect(() => {
    async function init() {
      // Check if auth is required by trying to access health endpoint
      const isHealthy = await apiClient.checkHealth();

      if (!isHealthy) {
        setAuthRequired(true);
        return;
      }

      // Try to create or load a document
      if (!currentDocument) {
        const newDoc = await apiClient.createDocument('Untitled');
        if (newDoc) {
          setCurrentDocument(newDoc);

          // Check for draft
          const draft = await apiClient.getDraft(newDoc.id);
          if (draft?.hasDraft) {
            // Will show restore option in editor
          }
        } else {
          // Auth might be required
          setAuthRequired(true);
        }
      }
    }

    init();
  }, []);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!currentDocument || !isUnsaved) return;

    const autosaveInterval = setInterval(async () => {
      await apiClient.autosaveDraft(currentDocument.id, currentDocument.content);
    }, 30000);

    return () => clearInterval(autosaveInterval);
  }, [currentDocument, isUnsaved]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+K: Command palette
      if (mod && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }

      // Ctrl/Cmd+S: Save
      if (mod && e.key === 's') {
        e.preventDefault();
        if (currentDocument) {
          handleSaveDocument();
        }
      }

      // Ctrl/Cmd+O: Open document list
      if (mod && e.key === 'o') {
        e.preventDefault();
        setShowDocumentList(true);
      }

      // Ctrl/Cmd+N: New document
      if (mod && e.key === 'n') {
        e.preventDefault();
        handleNewDocument();
      }

      // Ctrl/Cmd+Shift+S: Export options
      if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowExportModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDocument]);

  const handleAuthSubmit = (token: string) => {
    apiClient.setToken(token);
    setAuthRequired(false);
    // Reload app
    window.location.reload();
  };

  const handleDocumentChange = (content: string) => {
    if (currentDocument) {
      setCurrentDocument({ ...currentDocument, content });
      setIsUnsaved(true);
    }
  };

  const handleSaveDocument = async () => {
    if (!currentDocument) return;
    const success = await apiClient.saveDocument(currentDocument.id, currentDocument.content);
    if (success) {
      setIsUnsaved(false);
    }
  };

  const handleNewDocument = async () => {
    if (isUnsaved) {
      if (!confirm('You have unsaved changes. Create a new document?')) {
        return;
      }
    }
    const newDoc = await apiClient.createDocument('Untitled');
    if (newDoc) {
      setCurrentDocument(newDoc);
      setIsUnsaved(false);
    }
  };

  const handleSelectDocument = (doc: Document) => {
    if (isUnsaved) {
      if (!confirm('You have unsaved changes. Open another document?')) {
        return;
      }
    }
    setCurrentDocument(doc);
    setIsUnsaved(false);
    setShowDocumentList(false);
  };

  const handleExport = async (format: 'md' | 'odt') => {
    if (!currentDocument) return;

    try {
      let blob: Blob | null = null;
      let filename = currentDocument.name.replace(/\.md$/, '');

      if (format === 'md') {
        blob = await apiClient.exportAsMd(currentDocument.id);
        filename += '.md';
      } else {
        blob = await apiClient.exportAsOdt(currentDocument.id);
        filename += '.odt';
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }

    setShowExportModal(false);
  };

  const handleSyncAffine = async () => {
    if (!currentDocument) return;
    setIsSyncing(true);
    try {
      const success = await apiClient.syncToAffine(currentDocument.id);
      if (success) {
        alert('Document synced to AFFiNE folder');
      } else {
        alert('Failed to sync document');
      }
    } finally {
      setIsSyncing(false);
      setShowCommandPalette(false);
    }
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setAuthRequired(true);
  };

  if (authRequired) {
    return <AuthDialog onSubmit={handleAuthSubmit} />;
  }

  return (
    <>
      {currentDocument && (
        <Editor
          document={currentDocument}
          onChange={handleDocumentChange}
          isUnsaved={isUnsaved}
        />
      )}

      <StatusBar
        documentName={currentDocument?.name}
        isUnsaved={isUnsaved}
        isSyncing={isSyncing}
      />

      {showDocumentList && (
        <DocumentListModal
          onSelectDocument={handleSelectDocument}
          onClose={() => setShowDocumentList(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          onCommand={(cmd) => {
            switch (cmd) {
              case 'new':
                handleNewDocument();
                break;
              case 'open':
                setShowDocumentList(true);
                break;
              case 'save':
                handleSaveDocument();
                break;
              case 'export-md':
                handleExport('md');
                break;
              case 'export-odt':
                handleExport('odt');
                break;
              case 'sync-affine':
                handleSyncAffine();
                break;
              case 'logout':
                handleLogout();
                break;
            }
            setShowCommandPalette(false);
          }}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
    </>
  );
}
