import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number; // seconds
  onExpire: () => void;
  active: boolean;
}

export function Timer({ duration, onExpire, active }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const startRef = useRef<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    expiredRef.current = false;
    startRef.current = performance.now();
    setRemaining(duration);

    let frameId: number;
    const tick = () => {
      if (!startRef.current) return;
      const elapsed = (performance.now() - startRef.current) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);

      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        // Vibrate if available
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        onExpire();
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, duration, onExpire]);

  const seconds = Math.ceil(remaining);
  const fraction = remaining / duration;

  let colorClass = 'text-green-400';
  let bgClass = 'bg-green-500';
  if (remaining <= 5) {
    colorClass = 'text-red-400';
    bgClass = 'bg-red-500';
  } else if (remaining <= 10) {
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-500';
  }

  return (
    <div className="w-full">
      <div
        className={`text-6xl font-bold text-center tabular-nums ${colorClass} ${remaining <= 5 ? 'timer-critical' : ''}`}
      >
        {seconds}
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full ${bgClass} rounded-full transition-all duration-100`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
