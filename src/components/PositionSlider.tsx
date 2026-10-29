import React from 'react';
import type { UserStance, UserAnswerStatus } from '../types';
import { formatStanceLabel } from '../lib/compare';

interface PositionSliderProps {
  value: UserStance;
  status?: UserAnswerStatus;
  leftLabel: string;
  rightLabel: string;
  onChange: (stance: UserStance, status: UserAnswerStatus) => void;
  className?: string;
}

export const PositionSlider: React.FC<PositionSliderProps> = ({
  value,
  status,
  leftLabel,
  rightLabel,
  onChange,
  className = '',
}) => {
  const isNoOpinion = status === 'no-opinion';
  const hasSelection = value !== null && !isNoOpinion;

  const stops: Array<{
    val: -2 | -1 | 0 | 1 | 2;
    shortLabel: string;
    fullLabel: string;
  }> = [
    {
      val: -2,
      shortLabel: 'Strongly',
      fullLabel: formatStanceLabel(-2, { leftLabel, rightLabel }),
    },
    {
      val: -1,
      shortLabel: 'Lean',
      fullLabel: formatStanceLabel(-1, { leftLabel, rightLabel }),
    },
    {
      val: 0,
      shortLabel: 'Middle ground',
      fullLabel: formatStanceLabel(0, { leftLabel, rightLabel }),
    },
    {
      val: 1,
      shortLabel: 'Lean',
      fullLabel: formatStanceLabel(1, { leftLabel, rightLabel }),
    },
    {
      val: 2,
      shortLabel: 'Strongly',
      fullLabel: formatStanceLabel(2, { leftLabel, rightLabel }),
    },
  ];

  const handleSelect = (val: -2 | -1 | 0 | 1 | 2) => {
    onChange(val, 'answered');
  };

  const handleNoOpinion = () => {
    onChange(null, 'no-opinion');
  };

  const handleClear = () => {
    onChange(null, 'skipped');
  };

  return (
    <div className={`bg-stone-50 p-4 sm:p-5 rounded-xl border border-stone-200 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <label className="text-sm font-semibold text-stone-900">
          Where do you stand?
        </label>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-stone-600 hover:text-stone-900 hover:underline"
            >
              Clear choice
            </button>
          )}
          <button
            type="button"
            onClick={handleNoOpinion}
            className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
              isNoOpinion
                ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            No opinion / not sure
          </button>
        </div>
      </div>

      {/* Axis Ends Labels showing real leftLabel and rightLabel */}
      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-stone-800 mb-2">
        <div className="text-left pr-2 leading-snug">
          {leftLabel}
        </div>
        <div className="text-right pl-2 leading-snug">
          {rightLabel}
        </div>
      </div>

      {/* Visual 5-Stop Slider Track */}
      <div className="relative pt-4 pb-2 px-3 sm:px-6">
        {/* Track Line */}
        <div className="absolute top-6.5 left-6 right-6 h-1.5 bg-stone-200 rounded-full"></div>

        {/* Highlight segment if active */}
        {hasSelection && (
          <div
            className="absolute top-6.5 h-1.5 bg-teal-600 rounded-full transition-all duration-150"
            style={{
              left: value <= 0 ? `${((value + 2) / 4) * 100}%` : '50%',
              right: value >= 0 ? `${(1 - (value + 2) / 4) * 100}%` : '50%',
            }}
          />
        )}

        {/* 5 Stop Nodes */}
        <div className="relative flex justify-between items-center" role="radiogroup" aria-label="Policy position stops">
          {stops.map((stop) => {
            const isSelected = hasSelection && value === stop.val;
            return (
              <div key={stop.val} className="flex flex-col items-center">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={stop.fullLabel}
                  onClick={() => handleSelect(stop.val)}
                  className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-150 ${
                    isSelected
                      ? 'bg-teal-700 text-white ring-4 ring-teal-100 shadow-md scale-110'
                      : 'bg-white text-stone-700 border-2 border-stone-300 hover:border-teal-500 hover:text-teal-700'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-transform ${
                      isSelected ? 'bg-white scale-125' : 'bg-stone-300'
                    }`}
                  />
                </button>
                <span className={`text-[10px] sm:text-xs mt-2 text-center max-w-[65px] sm:max-w-[85px] leading-tight ${
                  isSelected ? 'font-semibold text-teal-800' : 'text-stone-600'
                }`}>
                  {stop.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected position feedback bar */}
      <div className="mt-4 pt-3 border-t border-stone-200">
        {hasSelection ? (
          <div className="flex items-start gap-2 bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 text-xs text-stone-800">
            <span className="font-semibold text-teal-800 shrink-0">Your stance:</span>
            <span className="font-medium text-teal-950">
              {formatStanceLabel(value, { leftLabel, rightLabel })}
            </span>
          </div>
        ) : isNoOpinion ? (
          <div className="bg-stone-100 rounded-lg p-2.5 text-xs text-stone-700 italic text-center">
            You marked &ldquo;No opinion / not sure&rdquo; on this issue. (It will not be counted toward candidate alignment).
          </div>
        ) : (
          <div className="text-xs text-stone-600 text-center italic">
            Select one of the 5 stops above, or mark &ldquo;No opinion / not sure&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
};
