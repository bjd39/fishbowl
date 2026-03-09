import { useReducer, useEffect, useState } from 'react';
import { gameReducer, initialGameState, GameContext } from './state/gameState';
import { WriterFlow } from './components/writer/WriterFlow';
import { GameSettings } from './components/host/GameSettings';
import { AddPlayers } from './components/host/AddPlayers';
import { DuplicateCheck } from './components/host/DuplicateCheck';
import { TeamAssignment } from './components/host/TeamAssignment';
import { TurnOrderSetup } from './components/host/TurnOrderSetup';
import { PreTurn } from './components/game/PreTurn';
import { ActiveTurn } from './components/game/ActiveTurn';
import { TurnSummary } from './components/game/TurnSummary';
import { RoundSummary } from './components/game/RoundSummary';
import { GameOver } from './components/game/GameOver';

function getRoute(): { mode: 'host' | 'writer'; slips?: number } {
  const hash = window.location.hash;
  if (hash.startsWith('#/write')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const slips = parseInt(params.get('slips') || '4', 10);
    return { mode: 'writer', slips };
  }
  return { mode: 'host' };
}

function HostApp() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.phase !== 'settings') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.phase]);

  const renderPhase = () => {
    switch (state.phase) {
      case 'settings':
        return <GameSettings />;
      case 'add-players':
        return <AddPlayers />;
      case 'duplicate-check':
        return <DuplicateCheck />;
      case 'team-assignment':
        return <TeamAssignment />;
      case 'turn-order':
        return <TurnOrderSetup />;
      case 'pre-turn':
        return <PreTurn />;
      case 'active-turn':
        return <ActiveTurn />;
      case 'turn-summary':
        return <TurnSummary />;
      case 'round-summary':
        return <RoundSummary />;
      case 'game-over':
        return <GameOver />;
      default:
        return <GameSettings />;
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      <div className="min-h-full flex flex-col">
        {renderPhase()}
      </div>
    </GameContext.Provider>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.mode === 'writer') {
    return <WriterFlow slipsRequired={route.slips || 4} />;
  }

  return <HostApp />;
}
