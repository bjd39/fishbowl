import { useGame } from '../../state/gameState';
import { Scoreboard } from '../shared/Scoreboard';

export function PreTurn() {
  const { state, dispatch } = useGame();

  const round = state.config.rounds[state.currentRoundIndex];
  const team = state.teams[state.currentTeamIndex];
  const playerId = team.playerIds[team.currentPlayerIndex];
  const player = state.players.find(p => p.id === playerId);

  const isRemote = player ? player.deviceId !== 'host' : false;

  const handleStartTurn = () => {
    if (isRemote) {
      dispatch({ type: 'START_REMOTE_TURN' });
    } else {
      dispatch({ type: 'START_TURN' });
    }
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col items-center justify-center space-y-6 slide-up">
      <div className="text-center space-y-1">
        <div className="text-sm text-slate-400">
          Round {state.currentRoundIndex + 1} of {state.config.rounds.length}
        </div>
        <h2 className="text-3xl font-bold">{round.name}</h2>
        {round.description && (
          <p className="text-slate-300 text-sm">{round.description}</p>
        )}
      </div>

      <Scoreboard />

      <div className="text-center">
        <div className="text-sm text-slate-400">
          {state.bowl.length} slip{state.bowl.length !== 1 ? 's' : ''} remaining
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="text-lg text-slate-300">It's</div>
        <div className="text-3xl font-bold text-blue-400">{player?.name}'s</div>
        <div className="text-lg text-slate-300">turn! ({team.name})</div>
      </div>

      {isRemote ? (
        <p className="text-slate-400 text-center">
          {player?.name}'s turn will run on their device
        </p>
      ) : (
        <p className="text-slate-400 text-center">
          Pass the phone to {player?.name}
        </p>
      )}

      <div className="w-full space-y-3">
        <button
          onClick={handleStartTurn}
          className="w-full py-5 bg-green-600 hover:bg-green-500 rounded-xl text-xl font-bold transition-colors"
        >
          {isRemote ? 'Send turn to their device' : 'Start turn'}
        </button>

        {team.playerIds.length > 1 && (
          <button
            onClick={() => dispatch({ type: 'SKIP_PLAYER' })}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            Skip {player?.name}
          </button>
        )}
      </div>
    </div>
  );
}
