import { useState } from 'react';

interface SlipCardProps {
  text: string;
  maxLength?: number;
}

export function SlipCard({ text, maxLength = 40 }: SlipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > maxLength && !expanded;

  return (
    <div
      className="bg-amber-50 text-slate-900 rounded-lg px-4 py-3 text-center text-xl font-semibold shadow-md"
      onClick={() => text.length > maxLength && setExpanded(!expanded)}
    >
      {truncated ? `${text.slice(0, maxLength)}...` : text}
    </div>
  );
}
