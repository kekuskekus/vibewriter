import { useState } from 'react';

interface AuthDialogProps {
  onSubmit: (token: string) => void;
}

export function AuthDialog({ onSubmit }: AuthDialogProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onSubmit(token.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <h2>Authentication Required</h2>
        <p style={{ marginBottom: '15px', color: '#00ff00', fontSize: '12px' }}>
          Enter the authentication token to access this application.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
