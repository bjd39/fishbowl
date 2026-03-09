import { useGame } from '../../state/gameState';

export function TurnOrderSetup() {
  const { state, dispatch } = useGame();

  const getPlayerName = (id: string) => state.players.find(p => p.id === id)?.name || 'Unknown';

  // Build interleaved order for display
  const maxPlayers = Math.max(...state.teams.map(t => t.playerIds.length));
  const interleaved: { playerId: string; teamName: string }[] = [];
  for (let i = 0; i < maxPlayers; i++) {
    for (const team of state.teams) {
      if (i < team.playerIds.length) {
        interleaved.push({
          playerId: team.playerIds[i],
          teamName: team.name,
        });
      }
    }
  }

  const movePlayer = (teamId: string, fromIdx: number, dir: -1 | 1) => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return;
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= team.playerIds.length) return;
    const newOrder = [...team.playerIds];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    dispatch({ type: 'UPDATE_TEAM', team: { ...team, playerIds: newOrder } });
  };

  const handleStart = () => {
    dispatch({ type: 'START_ROUND' });
  };

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 slide-up">
      <h2 className="text-2xl font-bold text-center">Turn Order</h2>

      <div className="space-y-4">
        {state.teams.map(team => (
          <div key={team.id} className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-400">{team.name}</h3>
            <ul className="space-y-1">
              {team.playerIds.map((pid, i) => (
                <li key={pid} className="flex items-center justify-between py-1">
                  <span>
                    <span className="text-slate-500 mr-2">{i + 1}.</span>
                    {getPlayerName(pid)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePlayer(team.id, i, -1)}
                      disabled={i === 0}
                      className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => movePlayer(team.id, i, 1)}
                      disabled={i === team.playerIds.length - 1}
                      className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm text-slate-400 mb-2">Turn sequence preview</h3>
        <div className="flex flex-wrap gap-2">
          {interleaved.map(({ playerId, teamName }, i) => (
            <span
              key={`${playerId}-${i}`}
              className="text-sm bg-slate-700 px-2 py-1 rounded"
            >
              {getPlayerName(playerId)}
              <span className="text-slate-500 ml-1 text-xs">({teamName})</span>
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-lg font-bold transition-colors"
      >
        Confirm & Start Round 1
      </button>
    </div>
  );
}
