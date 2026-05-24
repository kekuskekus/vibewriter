# FocusWriter

A minimal, distraction-free writing app with a Matrix-style theme. Write in plain text or Markdown with zero distractions.

## Features

- **Fullscreen distraction-free editor** with Matrix-style theme (black background, green monospaced text)
- **Plain text and Markdown** support
- **Autosave** every 30 seconds + manual save with Ctrl/Cmd+S
- **Keyboard-first** shortcuts and command palette
- **Export** as Markdown (.md) or OpenDocument (.odt)
- **AFFiNE sync** - export documents to a local folder for import into AFFiNE
- **Web-first architecture** - works on desktop, server, and browser

## Quick Start

### Local - Windows

1. Install [Node.js 18+](https://nodejs.org/)
2. Double-click `run-windows.bat` in the project folder
3. Open http://localhost:3000 in your browser

### Local - Linux/Mac

1. Install [Node.js 18+](https://nodejs.org/)
2. Run: `chmod +x run-linux.sh && ./run-linux.sh`
3. Open http://localhost:3000 in your browser

### Docker / Server Mode

```bash
docker compose up
```

Access at http://localhost:3000

To set a password/token, add to docker-compose or set env variable:

```bash
APP_AUTH_TOKEN=your-secret-token docker compose up
```

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+K** | Open command palette |
| **Ctrl+N** | New document |
| **Ctrl+O** | Open document |
| **Ctrl+S** | Save current document |
| **Ctrl+Shift+S** | Export options |
| **Escape** | Close dialog |

### Command Palette

Press **Ctrl+K** to open the command palette. Available commands:

- **New Document** - Create a new document
- **Open Document** - Switch between documents
- **Save** - Save current document
- **Export as Markdown** - Export as .md file
- **Export as ODT** - Export as .odt file
- **Sync to AFFiNE** - Export document to AFFiNE sync folder
- **Logout** - Clear authentication token

## Configuration

### Environment Variables

Set these to customize storage and behavior:

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `STORAGE_PATH` - Document storage directory
- `DRAFTS_PATH` - Autosave drafts directory
- `EXPORTS_PATH` - Exported files directory
- `AFFINE_SYNC_PATH` - AFFiNE sync folder path
- `APP_AUTH_TOKEN` - Authentication token (optional, for security)

### Default Storage Locations

If not configured via environment variables, files are stored in:

- **Windows**: `%USERPROFILE%\.focus-writer\`
- **Linux/Mac**: `~/.focus-writer/`

### Authentication

If `APP_AUTH_TOKEN` is set on the server, the app will ask for a token on first access. The token is stored in browser localStorage.

To logout, use the logout command in the command palette.

## AFFiNE Sync

The app can export documents to an AFFiNE sync folder. This is a **one-way export**, not bidirectional sync.

### How it works

1. Configure the sync folder via env variable: `AFFINE_SYNC_PATH=/path/to/affine/folder`
2. In FocusWriter, press **Ctrl+K** and select "Sync to AFFiNE"
3. The document is exported as Markdown to the configured folder
4. You can then import this folder into AFFiNE using AFFiNE's import mechanism

### Limitations (MVP)

- **One-way only** - exports from FocusWriter to AFFiNE, not the reverse
- **No conflict resolution** - if you edit the same file in both apps, last write wins
- **Markdown only** - exports as .md files with YAML frontmatter (title, dates, source)
- **No real AFFiNE Cloud sync** - this is local folder export, not official AFFiNE API
  - If AFFiNE releases an official stable sync/export API, it can be integrated behind a `SyncProvider` interface

## Data Storage

All data is stored locally on the filesystem:

- **Documents** - `.md` files + `.meta.json` metadata
- **Drafts** - Autosaved copies of unsaved work
- **Exports** - Markdown and ODT files from export actions

No cloud sync, no accounts, no databases.

## Project Structure

```
.
├── apps/
│   ├── web/              # React frontend (Vite)
│   └── server/           # Node.js backend (Fastify)
├── packages/
│   └── shared/           # Shared TypeScript types
├── Dockerfile            # Docker image
├── docker-compose.yml    # Docker Compose for local server
├── run-windows.bat       # Windows launcher
└── run-linux.sh          # Linux/Mac launcher
```

## Development

### Install dependencies

```bash
npm install
```

### Run dev mode (both frontend and backend)

```bash
npm run dev
```

This starts:
- Frontend dev server on http://localhost:5173 with hot reload
- Backend API on http://localhost:3000 (proxied by Vite)

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

## Technical Details

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Plain CSS** for styling (no heavy frameworks)
- Browser localStorage for auth token storage

### Backend

- **Fastify** web framework with TypeScript
- **Node.js filesystem** for document storage
- **Simple token-based auth** via `APP_AUTH_TOKEN` env variable
- **REST API** with validation and error handling

### Export Formats

- **Markdown (.md)** - Plain text with optional YAML frontmatter
- **ODT (.odt)** - Valid OpenDocument format (plain text only in MVP)

The ODT export creates a minimal but valid .odt file (which is a ZIP with specific XML structure) compatible with LibreOffice, Word, and other ODF-supporting software.

## Limitations & Future Improvements

### MVP Scope

✅ **Done**
- Fullscreen editor with Matrix theme
- Create, save, open documents
- Autosave every 30 seconds
- Keyboard shortcuts and command palette
- Export as .md and .odt
- One-way AFFiNE folder export
- Docker support with authentication

❌ **Not Implemented** (by design)

- Collaborative editing
- User accounts / multi-user
- Rich text formatting
- Font customization
- Theme switching
- Mobile UI
- Full ODT round-trip editing
- AI writing features
- Bidirectional sync
- Real AFFiNE Cloud API sync (not stable/official)

### Future Considerations

If you want to extend the app:

1. **Bidirectional AFFiNE sync** - Implement `SyncProvider` interface with conflict resolution
2. **Official AFFiNE API** - When stable, create `OfficialAffineSyncProvider`
3. **Mobile support** - Responsive CSS + mobile-optimized UI
4. **Plugin system** - Allow custom export formats via plugins
5. **Search** - Full-text search across documents
6. **Tags/Categories** - Simple document organization

## Security Notes

- **Local mode**: No auth by default. Suitable for personal use on trusted machines.
- **Server mode**: Always set `APP_AUTH_TOKEN` before deploying to internet
- **Path traversal protection**: File paths are sanitized to prevent directory traversal
- **No SQL injection**: Using filesystem, not databases
- **Token handling**: Stored in browser localStorage, sent as Bearer token in Authorization header

## Troubleshooting

### Port already in use

Change the port:

```bash
PORT=3001 npm start
```

Or in docker-compose.yml, change the `ports` mapping.

### Node.js not found

Install [Node.js 18+](https://nodejs.org/)

### Build fails

Clear node_modules and reinstall:

```bash
rm -rf node_modules
npm install
npm run build
```

### Autosave not working

Check browser console (F12) for errors. Autosave requires:
- Server running
- API accessible
- Document ID valid
- Disk space available

## License

MIT

## Support

For issues or questions, check the code comments or the git commit history for context on why things were implemented a certain way.

---

**Built as a minimal MVP of a distraction-free writing app.**  
Focus on writing, not UI chrome. 📝
