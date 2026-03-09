import { useGame } from '../../state/gameState';
import { findDuplicates } from '../../utils/dedup';

export function DuplicateCheck() {
  const { state, dispatch } = useGame();
  const { removedCount } = findDuplicates(state.allSlips);

  const handleContinue = () => {
    dispatch({ type: 'RUN_DEDUP' });
    dispatch({ type: 'SET_PHASE', phase: 'team-assignment' });
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-3">
        <div className="text-5xl">🔍</div>
        <h2 className="text-2xl font-bold">Duplicate Check</h2>
        <p className="text-lg text-slate-300">
          {removedCount} duplicate slip{removedCount !== 1 ? 's were' : ' was'} removed
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-bold transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
