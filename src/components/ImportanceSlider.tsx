import React from 'react';
import type { UserImportance } from '../types';

interface ImportanceSliderProps {
  value: UserImportance;
  onChange: (importance: UserImportance) => void;
  className?: string;
}

export const ImportanceSlider: React.FC<ImportanceSliderProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const levels: Array<{
    val: 0 | 1 | 2 | 3 | 4 | 5;
    label: string;
  }> = [
    { val: 0, label: 'Not important' },
    { val: 1, label: 'Slightly' },
    { val: 2, label: 'Somewhat' },
    { val: 3, label: 'Moderately' },
    { val: 4, label: 'Very' },
    { val: 5, label: 'Essential' },
  ];

  const currentLevel = levels.find((l) => l.val === value);

  return (
    <div className={`bg-stone-50 p-4 rounded-xl border border-stone-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="importance-range" className="text-sm font-semibold text-stone-900">
          How important is this issue to your vote?
        </label>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-800">
          {currentLevel ? `${currentLevel.label} (${value}/5)` : 'Set priority'}
        </span>
      </div>

      <div className="pt-2 pb-1">
        <input
          id="importance-range"
          type="range"
          min="0"
          max="5"
          step="1"
          value={value ?? 3}
          onChange={(e) => onChange(Number(e.target.value) as UserImportance)}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-600"
          aria-label="Importance of this issue to your vote, from 0 (Not important) to 5 (Essential)"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={value ?? 3}
          aria-valuetext={currentLevel?.label || 'Moderately'}
        />

        {/* 6 Labels */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-stone-500 mt-2 font-medium">
          {levels.map((lvl) => {
            const isChosen = value === lvl.val;
            return (
              <button
                key={lvl.val}
                type="button"
                onClick={() => onChange(lvl.val)}
                className={`transition-colors text-center ${
                  isChosen ? 'font-bold text-stone-900 underline' : 'hover:text-stone-700'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
