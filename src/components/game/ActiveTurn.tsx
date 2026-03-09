import { useCallback, useRef } from 'react';
import { useGame } from '../../state/gameState';
import { Timer } from '../shared/Timer';

export function ActiveTurn() {
  const { state, dispatch } = useGame();
  const lastGotItRef = useRef(0);

  const slip = state.allSlips.find(s => s.id === state.turnSlipId);
  const canPass =
    state.config.passesPerTurn > 0 &&
    state.turnPassesRemaining > 0 &&
    state.bowl.length > 1;
  const showPassButton = state.config.passesPerTurn > 0;

  const onExpire = useCallback(() => {
    dispatch({ type: 'TIMER_EXPIRED' });
  }, [dispatch]);

  const handleGotIt = useCallback(() => {
    const now = Date.now();
    if (now - lastGotItRef.current < 1000) return;
    lastGotItRef.current = now;
    dispatch({ type: 'GOT_IT' });
  }, [dispatch]);

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col slide-up">
      {/* Timer */}
      <div className="mb-6">
        <Timer
          duration={state.config.timerDuration}
          onExpire={onExpire}
          active={state.turnActive}
        />
      </div>

      {/* Current Slip */}
      <div className="flex-1 flex items-center justify-center">
        {slip ? (
          <div className="bg-amber-50 text-slate-900 rounded-2xl px-6 py-8 text-center shadow-lg w-full">
            <div className="text-3xl font-bold leading-snug">
              {slip.text}
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center">No slip</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-6 pb-4">
        <button
          onClick={handleGotIt}
          className="w-full py-5 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-xl text-xl font-bold transition-colors"
        >
          Got It!
        </button>

        <div className="flex gap-3">
          {showPassButton && (
            <button
              onClick={() => dispatch({ type: 'PASS_SLIP' })}
              disabled={!canPass}
              className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-semibold transition-colors"
            >
              Pass
              {state.config.passesPerTurn !== Infinity && (
                <span className="block text-xs mt-0.5">
                  {state.turnPassesRemaining} left
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => dispatch({ type: 'FOUL' })}
            className="flex-1 py-4 bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-xl font-semibold transition-colors"
          >
            Foul
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'END_TURN' })}
          className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          End Turn Early
        </button>
      </div>
    </div>
  );
}
