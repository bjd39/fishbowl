import { useState } from 'react';
import { PlayerNameEntry } from './PlayerNameEntry';
import { SlipEntry } from './SlipEntry';
import { QRCodeDisplay } from './QRCodeDisplay';

type WriterStep = 'name' | 'slips' | 'qr';

interface WriterFlowProps {
  slipsRequired: number;
}

export function WriterFlow({ slipsRequired }: WriterFlowProps) {
  const [step, setStep] = useState<WriterStep>('name');
  const [playerName, setPlayerName] = useState('');
  const [slips, setSlips] = useState<string[]>([]);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setStep('slips');
  };

  const handleSlipsComplete = (entries: string[]) => {
    setSlips(entries);
    setStep('qr');
  };

  const handleAddAnother = () => {
    setPlayerName('');
    setSlips([]);
    setStep('name');
  };

  return (
    <div className="min-h-full flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        🐟 Fishbowl
      </h1>

      {step === 'name' && <PlayerNameEntry onSubmit={handleNameSubmit} />}
      {step === 'slips' && (
        <SlipEntry
          playerName={playerName}
          slipsRequired={slipsRequired}
          onComplete={handleSlipsComplete}
          onBack={() => setStep('name')}
        />
      )}
      {step === 'qr' && (
        <QRCodeDisplay
          playerName={playerName}
          slips={slips}
          onAddAnother={handleAddAnother}
        />
      )}
    </div>
  );
}
