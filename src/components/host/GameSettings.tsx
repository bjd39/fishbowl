import { useState } from 'react';
import { useGame } from '../../state/gameState';
import type { GameConfig, RoundConfig } from '../../types';
import { ROUND_SUGGESTIONS } from '../../types';

export function GameSettings() {
  const { state, dispatch } = useGame();
  const [config, setConfig] = useState<GameConfig>({ ...state.config });
  const [showInfo, setShowInfo] = useState(false);

  const updateConfig = (partial: Partial<GameConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const updateRound = (index: number, partial: Partial<RoundConfig>) => {
    const rounds = config.rounds.map((r, i) =>
      i === index ? { ...r, ...partial } : r,
    );
    updateConfig({ rounds });
  };

  const addRound = () => {
    updateConfig({
      rounds: [...config.rounds, { name: '', description: '' }],
    });
  };

  const removeRound = (index: number) => {
    updateConfig({ rounds: config.rounds.filter((_, i) => i !== index) });
  };

  const moveRound = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= config.rounds.length) return;
    const rounds = [...config.rounds];
    [rounds[index], rounds[newIndex]] = [rounds[newIndex], rounds[index]];
    updateConfig({ rounds });
  };

  const handleSubmit = () => {
    dispatch({ type: 'SET_CONFIG', config });
    dispatch({ type: 'SET_PHASE', phase: 'add-players' });
  };

  const passOptions = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: Infinity, label: 'Unlimited' },
  ];

  return (
    <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 slide-up">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">Fishbowl</h1>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-7 h-7 rounded-full border border-slate-500 text-slate-400 text-sm hover:border-slate-300 hover:text-white transition-colors"
            aria-label="What is Fishbowl?"
          >
            ?
          </button>
        </div>
        {showInfo && (
          <div className="mt-3 text-left bg-slate-800 rounded-lg p-4 text-sm text-slate-300 space-y-2 slide-up">
            <p>
              <strong className="text-white">Fishbowl</strong> is a party game where everyone writes names of famous people, characters, or things on slips of paper and puts them in a bowl.
            </p>
            <p>
              Players split into teams and take turns pulling slips from the bowl, trying to get their teammates to guess as many as possible before the timer runs out.
            </p>
            <p>
              The same slips are used across multiple rounds, each with different rules — first describe freely, then one word only, then charades. Knowing what's in the bowl from earlier rounds is half the fun!
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Network mode toggle */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            How are players joining?
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateConfig({ networkMode: 'online' })}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors text-sm ${
                config.networkMode === 'online'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <div>On their phones</div>
              <div className={`text-xs mt-0.5 ${config.networkMode === 'online' ? 'text-blue-200' : 'text-slate-500'}`}>
                Everyone plays on their own device
              </div>
            </button>
            <button
              onClick={() => updateConfig({ networkMode: 'local' })}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors text-sm ${
                config.networkMode === 'local'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <div>Pass the phone</div>
              <div className={`text-xs mt-0.5 ${config.networkMode === 'local' ? 'text-blue-200' : 'text-slate-500'}`}>
                One device, pass it around
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Timer Duration: {config.timerDuration}s
          </label>
          <input
            type="range"
            min={15}
            max={60}
            step={5}
            value={config.timerDuration}
            onChange={e => updateConfig({ timerDuration: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>15s</span><span>60s</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Slips per player
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={config.slipsPerPlayer}
            onChange={e => updateConfig({ slipsPerPlayer: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Passes per turn
          </label>
          <div className="flex gap-2">
            {passOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => updateConfig({ passesPerTurn: opt.value })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  config.passesPerTurn === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Rounds</label>
          <div className="space-y-3">
            {config.rounds.map((round, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
                  <select
                    value={ROUND_SUGGESTIONS.includes(round.name) ? round.name : '__custom'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__custom') {
                        updateRound(i, { name: '' });
                      } else {
                        updateRound(i, { name: val });
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROUND_SUGGESTIONS.filter(s =>
                      s === round.name || !config.rounds.some(r => r.name === s)
                    ).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__custom">Custom...</option>
                  </select>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveRound(i, -1)}
                      disabled={i === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      aria-label="Move round up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveRound(i, 1)}
                      disabled={i === config.rounds.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      aria-label="Move round down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeRound(i)}
                      className="p-1 text-red-400 hover:text-red-300"
                      aria-label="Remove round"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {!ROUND_SUGGESTIONS.includes(round.name) && (
                  <input
                    type="text"
                    value={round.name}
                    onChange={e => updateRound(i, { name: e.target.value })}
                    placeholder="Round name"
                    className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <input
                  type="text"
                  value={round.description}
                  onChange={e => updateRound(i, { description: e.target.value })}
                  placeholder="Rules description (optional)"
                  className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addRound}
            className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            + Add Round
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={config.rounds.length === 0 || config.rounds.some(r => !r.name.trim())}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-lg font-bold transition-colors"
      >
        {config.networkMode === 'online' ? 'Generate join code' : 'Next'}
      </button>
    </div>
  );
}
