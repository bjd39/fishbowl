import { useState } from 'react';

interface Props {
  onSubmit: (name: string) => void;
}

export function PlayerNameEntry({ onSubmit }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <label className="block text-lg font-medium text-center">
        What's your name?
      </label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        maxLength={40}
        autoFocus
        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-lg font-semibold transition-colors"
      >
        Continue
      </button>
    </form>
  );
}
