
import React from 'react';
import { Delete } from 'lucide-react';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const NumPad: React.FC<NumPadProps> = ({ value, onChange, maxLength = 4 }) => {
  const handlePress = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mt-4 select-none">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          onClick={() => handlePress(n.toString())}
          className="h-14 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-xl text-slate-700 active:bg-slate-100 active:scale-95 transition-all touch-manipulation"
        >
          {n}
        </button>
      ))}
      <div className="h-14"></div>
      <button
        onClick={() => handlePress('0')}
        className="h-14 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-xl text-slate-700 active:bg-slate-100 active:scale-95 transition-all touch-manipulation"
      >
        0
      </button>
      <button
        onClick={handleBackspace}
        className="h-14 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-slate-700 active:bg-slate-100 active:scale-95 transition-all touch-manipulation"
      >
        <Delete size={24} />
      </button>
    </div>
  );
};
