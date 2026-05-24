import { useEffect, useRef, useState } from 'react';

type CommandType = 'new' | 'open' | 'save' | 'export-md' | 'export-odt' | 'sync-affine' | 'logout';

interface Command {
  id: CommandType;
  title: string;
  description: string;
  shortcut?: string;
}

const COMMANDS: Command[] = [
  { id: 'new', title: 'New Document', description: 'Create a new document', shortcut: 'Ctrl+N' },
  { id: 'open', title: 'Open Document', description: 'Open an existing document', shortcut: 'Ctrl+O' },
  { id: 'save', title: 'Save', description: 'Save the current document', shortcut: 'Ctrl+S' },
  { id: 'export-md', title: 'Export as Markdown', description: 'Export as .md file' },
  { id: 'export-odt', title: 'Export as ODT', description: 'Export as .odt file' },
  { id: 'sync-affine', title: 'Sync to AFFiNE', description: 'Export document to AFFiNE sync folder' },
  { id: 'logout', title: 'Logout', description: 'Clear authentication token and logout' },
];

interface CommandPaletteProps {
  onCommand: (cmd: CommandType) => void;
  onClose: () => void;
}

export function CommandPalette({ onCommand, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) {
          onCommand(cmd.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onCommand, onClose]);

  return (
    <div className="command-palette" onClick={onClose}>
      <input
        ref={inputRef}
        type="text"
        className="command-palette-input"
        placeholder="Command palette (type to search, arrow keys to navigate, Enter to execute)"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedIndex(0);
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <ul className="command-palette-list">
        {filtered.map((cmd, idx) => (
          <li
            key={cmd.id}
            className={`command-palette-item ${idx === selectedIndex ? 'selected' : ''}`}
            onClick={() => onCommand(cmd.id)}
          >
            <div className="command-palette-item-title">{cmd.title}</div>
            <div className="command-palette-item-desc">
              {cmd.description}
              {cmd.shortcut && ` • ${cmd.shortcut}`}
            </div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li style={{ padding: '20px', textAlign: 'center', color: '#008800' }}>
            No matching commands. Press Esc to close.
          </li>
        )}
      </ul>
    </div>
  );
}
