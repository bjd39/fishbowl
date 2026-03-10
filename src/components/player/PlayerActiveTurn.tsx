import { useState, useCallback, useRef, useEffect } from 'react';
import { Timer } from '../shared/Timer';
import { usePlayerNetwork } from '../../network/PlayerNetworkContext';
import type { TurnAssignmentMessage } from '../../network/messages';

interface BowlSlip {
  id: string;
  text: string;
}

function drawSlip(bowl: BowlSlip[], currentId: string | null): BowlSlip | null {
  if (bowl.length === 0) return null;
  if (bowl.length === 1) return bowl[0];
  const available = bowl.filter((s) => s.id !== currentId);
  return available[Math.floor(Math.random() * available.length)];
}

interface Props {
  assignment: TurnAssignmentMessage;
  onTurnComplete: () => void;
}

export function PlayerActiveTurn({ assignment, onTurnComplete }: Props) {
  const { send } = usePlayerNetwork();
  const [phase, setPhase] = useState<'pre-turn' | 'active' | 'done'>('pre-turn');
  const [bowl, setBowl] = useState<BowlSlip[]>(() => [...assignment.bowl]);
  const [currentSlip, setCurrentSlip] = useState<BowlSlip | null>(null);
  const [passesRemaining, setPassesRemaining] = useState(assignment.passesAllowed);
  const [guessedCount, setGuessedCount] = useState(0);
  const [turnActive, setTurnActive] = useState(false);

  // Use refs for mutable turn data to avoid stale closures in timer callback
  const guessedRef = useRef<{ slipId: string; timeToGuess: number }[]>([]);
  const foulsRef = useRef<string[]>([]);
  const passedRef = useRef<string[]>([]);
  const slipShownRef = useRef<number>(0);
  const lastGotItRef = useRef(0);
  const turnCompleteRef = useRef(false);
  const timerStartRef = useRef<number>(0);
  const bowlRef = useRef(bowl);
  bowlRef.current = bowl;

  // Send heartbeat every 2.5s during active turn
  useEffect(() => {
    if (!turnActive) return;
    timerStartRef.current = performance.now();

    const interval = setInterval(() => {
      const elapsed = (performance.now() - timerStartRef.current) / 1000;
      const remaining = Math.max(0, assignment.timerDuration - elapsed);
      send({ type: 'heartbeat', timerRemaining: remaining });
    }, 2500);

    return () => clearInterval(interval);
  }, [turnActive, assignment.timerDuration, send]);

  const sendResult = useCallback(
    (endReason: 'timer' | 'voluntary' | 'bowl_empty') => {
      if (turnCompleteRef.current) return;
      turnCompleteRef.current = true;
      setTurnActive(false);
      setPhase('done');

      send({
        type: 'turn_result',
        playerId: assignment.playerId,
        guessed: guessedRef.current,
        fouls: foulsRef.current,
        passed: passedRef.current,
        endReason,
      });

      setTimeout(onTurnComplete, 2000);
    },
    [send, assignment.playerId, onTurnComplete],
  );

  const handleStart = useCallback(() => {
    send({ type: 'player_ready', playerId: assignment.playerId });
    const firstSlip = drawSlip(bowlRef.current, null);
    setCurrentSlip(firstSlip);
    slipShownRef.current = performance.now();
    setTurnActive(true);
    setPhase('active');
  }, [send, assignment.playerId]);

  const handleGotIt = useCallback(() => {
    if (!currentSlip || turnCompleteRef.current) return;
    const now = Date.now();
    if (now - lastGotItRef.current < 1000) return;
    lastGotItRef.current = now;

    const timeToGuess = performance.now() - slipShownRef.current;
    guessedRef.current = [...guessedRef.current, { slipId: currentSlip.id, timeToGuess }];
    setGuessedCount(guessedRef.current.length);

    const newBowl = bowl.filter((s) => s.id !== currentSlip.id);
    setBowl(newBowl);

    if (newBowl.length === 0) {
      sendResult('bowl_empty');
      return;
    }

    const next = drawSlip(newBowl, null);
    setCurrentSlip(next);
    slipShownRef.current = performance.now();
  }, [currentSlip, bowl, sendResult]);

  const handlePass = useCallback(() => {
    if (!currentSlip || turnCompleteRef.current) return;
    if (passesRemaining <= 0) return;
    if (bowl.length <= 1) return;

    passedRef.current = [...passedRef.current, currentSlip.id];
    setPassesRemaining((prev) => prev - 1);
    const next = drawSlip(bowl, currentSlip.id);
    setCurrentSlip(next);
    slipShownRef.current = performance.now();
  }, [currentSlip, bowl, passesRemaining]);

  const handleFoul = useCallback(() => {
    if (!currentSlip || turnCompleteRef.current) return;

    foulsRef.current = [...foulsRef.current, currentSlip.id];
    const next = drawSlip(bowl, currentSlip.id);
    setCurrentSlip(next || currentSlip);
    slipShownRef.current = performance.now();
  }, [currentSlip, bowl]);

  const handleTimerExpired = useCallback(() => {
    sendResult('timer');
  }, [sendResult]);

  const canPass =
    assignment.passesAllowed > 0 && passesRemaining > 0 && bowl.length > 1;
  const showPassButton = assignment.passesAllowed > 0;

  // Pre-turn screen
  if (phase === 'pre-turn') {
    return (
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
        <div className="text-center space-y-1">
          <div className="text-sm text-slate-400">{assignment.roundName}</div>
          <p className="text-slate-300 text-sm">{assignment.roundDescription}</p>
        </div>

        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-blue-400">It's your turn!</div>
          <div className="text-sm text-slate-400">
            {bowl.length} slip{bowl.length !== 1 ? 's' : ''} in the bowl
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-5 bg-green-600 hover:bg-green-500 rounded-xl text-xl font-bold transition-colors"
        >
          Start turn
        </button>
      </div>
    );
  }

  // Done screen
  if (phase === 'done') {
    return (
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
        <div className="text-center space-y-2">
          <div className="text-6xl">✓</div>
          <h2 className="text-2xl font-bold">
            You got {guessedCount} slip{guessedCount !== 1 ? 's' : ''}!
          </h2>
        </div>
        <p className="text-slate-400 text-sm">Sending results to host...</p>
      </div>
    );
  }

  // Active turn
  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col slide-up">
      <div className="mb-6">
        <Timer
          duration={assignment.timerDuration}
          onExpire={handleTimerExpired}
          active={turnActive}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        {currentSlip ? (
          <div className="bg-amber-50 text-slate-900 rounded-2xl px-6 py-8 text-center shadow-lg w-full">
            <div className="text-3xl font-bold leading-snug">
              {currentSlip.text}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center">No slip</div>
        )}
      </div>

      <div className="space-y-3 mt-6 pb-4">
        <button
          onClick={handleGotIt}
          className="w-full py-5 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-xl text-xl font-bold transition-colors"
        >
          Got it!
        </button>

        <div className="flex gap-3">
          {showPassButton && (
            <button
              onClick={handlePass}
              disabled={!canPass}
              className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-semibold transition-colors"
            >
              Pass
              {assignment.passesAllowed !== Infinity && (
                <span className="block text-xs mt-0.5">
                  {passesRemaining} left
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleFoul}
            className="flex-1 py-4 bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-xl font-semibold transition-colors"
          >
            Foul
          </button>
        </div>

        <button
          onClick={() => sendResult('voluntary')}
          className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          End turn early
        </button>
      </div>
    </div>
  );
}
