import { useEffect, useRef, useState } from 'react';
import { Document } from '@focus-writer/shared';
import { apiClient } from '../utils/api';
import '../styles/editor.css';

interface EditorProps {
  document: Document;
  onChange: (content: string) => void;
  isUnsaved: boolean;
}

export function Editor({ document, onChange, isUnsaved }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    async function checkForDraft() {
      const draftData = await apiClient.getDraft(document.id);
      if (draftData?.hasDraft) {
        setDraft(draftData.content);
        setShowDraftRestore(true);
      }
    }

    checkForDraft();
  }, [document.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = document.content;
      textareaRef.current.focus();
    }
  }, [document.id]);

  const handleRestoreDraft = () => {
    if (draft && textareaRef.current) {
      textareaRef.current.value = draft;
      onChange(draft);
      setShowDraftRestore(false);
    }
  };

  const handleDiscardDraft = () => {
    setShowDraftRestore(false);
  };

  return (
    <div className="editor-container">
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        placeholder="Start writing..."
        onChange={(e) => onChange(e.target.value)}
        spellCheck="false"
      />

      {showDraftRestore && (
        <div className="draft-restore-banner">
          <div className="draft-restore-message">
            You have an unsaved draft. Restore it?
          </div>
          <div className="draft-restore-buttons">
            <button onClick={handleRestoreDraft} className="btn-restore">
              Restore Draft
            </button>
            <button onClick={handleDiscardDraft} className="btn-discard">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
