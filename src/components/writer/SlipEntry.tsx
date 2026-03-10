import { useState } from 'react';

interface Props {
  playerName: string;
  slipsRequired: number;
  onComplete: (slips: string[]) => void;
  onBack: () => void;
  submitLabel?: string;
}

export function SlipEntry({ playerName, slipsRequired, onComplete, onBack, submitLabel = 'Generate QR code' }: Props) {
  const [slips, setSlips] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = current.trim();
    if (!text) return;
    if (text.length > 80) return;

    if (editIndex !== null) {
      const updated = [...slips];
      updated[editIndex] = text;
      setSlips(updated);
      setEditIndex(null);
    } else if (slips.length < slipsRequired) {
      setSlips([...slips, text]);
    }
    setCurrent('');
  };

  const handleDelete = (index: number) => {
    setSlips(slips.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setCurrent('');
    }
  };

  const handleEdit = (index: number) => {
    setCurrent(slips[index]);
    setEditIndex(index);
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="text-center">
        <span className="text-lg font-medium">{playerName}</span>
        <span className="text-slate-400 ml-2">
          — {slips.length} of {slipsRequired} slips
        </span>
      </div>

      {slips.length < slipsRequired || editIndex !== null ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            placeholder="Person, place, or thing..."
            maxLength={80}
            autoFocus
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!current.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold transition-colors"
          >
            {editIndex !== null ? 'Save' : 'Add'}
          </button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {slips.map((slip, i) => (
          <li
            key={i}
            className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2"
          >
            <span className="truncate mr-2">{slip}</span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleEdit(i)}
                className="text-sm text-blue-400 hover:text-blue-300"
                aria-label={`Edit ${slip}`}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(i)}
                className="text-sm text-red-400 hover:text-red-300"
                aria-label={`Delete ${slip}`}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onComplete(slips)}
          disabled={slips.length !== slipsRequired}
          className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-semibold transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
