import { useGame } from '../../state/gameState';
import { Scoreboard } from '../shared/Scoreboard';

export function TurnSummary() {
  const { state, dispatch } = useGame();

  const player = state.players.find(p => p.id === state.turnClueGiverId);
  const guessedSlips = state.turnGuessed.map(g => {
    const slip = state.allSlips.find(s => s.id === g.slipId);
    return slip?.text || 'Unknown';
  });

  const bowlEmpty = state.bowl.length === 0;

  // Next player info
  const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
  const nextTeam = state.teams[nextTeamIndex];
  const nextPlayerId = nextTeam.playerIds[nextTeam.currentPlayerIndex];
  const nextPlayer = state.players.find(p => p.id === nextPlayerId);

  const handleNext = () => {
    if (bowlEmpty) {
      dispatch({ type: 'END_ROUND' });
    } else {
      dispatch({ type: 'NEXT_TURN' });
    }
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {player?.name} got {guessedSlips.length} slip{guessedSlips.length !== 1 ? 's' : ''}!
        </h2>
      </div>

      {guessedSlips.length > 0 && (
        <ul className="w-full space-y-2">
          {guessedSlips.map((text, i) => (
            <li
              key={i}
              className="bg-slate-800 rounded-lg px-4 py-2 text-center"
            >
              {text}
            </li>
          ))}
        </ul>
      )}

      <Scoreboard />

      {bowlEmpty ? (
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-yellow-400">Round Over!</div>
          <button
            onClick={handleNext}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-bold transition-colors"
          >
            See Round Summary
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4 w-full">
          <p className="text-slate-400">
            Next up: <span className="text-white font-medium">{nextPlayer?.name}</span>
            <span className="text-slate-500 ml-1">({nextTeam.name})</span>
          </p>
          <button
            onClick={handleNext}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-bold transition-colors"
          >
            Next Turn
          </button>
        </div>
      )}
    </div>
  );
}
