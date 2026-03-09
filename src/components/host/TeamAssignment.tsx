import { useState, useEffect } from 'react';
import { useGame } from '../../state/gameState';
import type { Team } from '../../types';

export function TeamAssignment() {
  const { state, dispatch } = useGame();
  const [numTeams, setNumTeams] = useState(2);
  const [mode, setMode] = useState<'random' | 'manual'>('random');

  useEffect(() => {
    dispatch({ type: 'SHUFFLE_TEAMS', numTeams });
  }, []);

  const handleShuffle = () => {
    dispatch({ type: 'SHUFFLE_TEAMS', numTeams });
  };

  const handleNumTeamsChange = (n: number) => {
    setNumTeams(n);
    dispatch({ type: 'SHUFFLE_TEAMS', numTeams: n });
  };

  const handleTeamNameChange = (teamId: string, name: string) => {
    const team = state.teams.find(t => t.id === teamId);
    if (team) {
      dispatch({ type: 'UPDATE_TEAM', team: { ...team, name } });
    }
  };

  const movePlayer = (playerId: string, toTeamId: string) => {
    // Remove from current team
    const currentTeam = state.teams.find(t => t.playerIds.includes(playerId));
    if (!currentTeam || currentTeam.id === toTeamId) return;

    const updatedCurrent: Team = {
      ...currentTeam,
      playerIds: currentTeam.playerIds.filter(id => id !== playerId),
    };
    dispatch({ type: 'UPDATE_TEAM', team: updatedCurrent });

    const targetTeam = state.teams.find(t => t.id === toTeamId);
    if (targetTeam) {
      const updatedTarget: Team = {
        ...targetTeam,
        playerIds: [...targetTeam.playerIds, playerId],
      };
      dispatch({ type: 'UPDATE_TEAM', team: updatedTarget });
    }

    // Update player's teamId
  };

  const handleStart = () => {
    dispatch({ type: 'SET_PHASE', phase: 'turn-order' });
  };

  const getPlayerName = (id: string) => state.players.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 slide-up">
      <h2 className="text-2xl font-bold text-center">Teams</h2>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('random')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'random' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Random
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Manual
        </button>
      </div>

      {mode === 'random' && (
        <div className="flex items-center justify-center gap-3">
          <label className="text-slate-400">Teams:</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handleNumTeamsChange(n)}
                className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                  numTeams === n ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handleShuffle}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Shuffle
          </button>
        </div>
      )}

      <div className="space-y-4">
        {state.teams.map(team => (
          <div key={team.id} className="bg-slate-800 rounded-lg p-4">
            <input
              type="text"
              value={team.name}
              onChange={e => handleTeamNameChange(team.id, e.target.value)}
              className="w-full mb-2 px-3 py-1 rounded bg-slate-700 border border-slate-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <ul className="space-y-1">
              {team.playerIds.map(pid => (
                <li key={pid} className="flex items-center justify-between py-1">
                  <span>{getPlayerName(pid)}</span>
                  {mode === 'manual' && (
                    <select
                      value={team.id}
                      onChange={e => movePlayer(pid, e.target.value)}
                      className="text-sm bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    >
                      {state.teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
              {team.playerIds.length === 0 && (
                <li className="text-slate-500 text-sm italic">No players</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={state.teams.some(t => t.playerIds.length === 0)}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-lg font-bold transition-colors"
      >
        Start game
      </button>
    </div>
  );
}
