import { useState, useEffect } from 'react';
import { PlayerNameEntry } from '../writer/PlayerNameEntry';
import { SlipEntry } from '../writer/SlipEntry';
import { usePlayerNetwork } from '../../network/PlayerNetworkContext';

type Step = 'name' | 'slips' | 'submitted';

interface Props {
  slipsRequired: number;
  onSubmitted: (playerName: string) => void;
}

export function WriteSlips({ slipsRequired, onSubmitted }: Props) {
  const { send, lastAccepted, lastRejected, clearLastRejected } = usePlayerNetwork();
  const [step, setStep] = useState<Step>('name');
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    clearLastRejected();
    setStep('slips');
  };

  const handleSlipsComplete = (slips: string[]) => {
    setSubmitting(true);
    send({ type: 'player_submit', playerName, slips });
  };

  // Watch for acceptance
  useEffect(() => {
    if (submitting && lastAccepted) {
      setStep('submitted');
      setSubmitting(false);
      onSubmitted(playerName);
    }
  }, [submitting, lastAccepted, playerName, onSubmitted]);

  // Watch for rejection
  useEffect(() => {
    if (submitting && lastRejected) {
      setSubmitting(false);
      setStep('name');
    }
  }, [submitting, lastRejected]);

  return (
    <div className="flex-1 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">🐟 Fishbowl</h1>

      {lastRejected && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-center">
          {lastRejected.reason}
        </div>
      )}

      {step === 'name' && <PlayerNameEntry onSubmit={handleNameSubmit} />}
      {step === 'slips' && (
        <>
          {submitting ? (
            <div className="text-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400">Submitting slips...</p>
            </div>
          ) : (
            <SlipEntry
              playerName={playerName}
              slipsRequired={slipsRequired}
              onComplete={handleSlipsComplete}
              onBack={() => setStep('name')}
              submitLabel="Submit slips"
            />
          )}
        </>
      )}
    </div>
  );
}
