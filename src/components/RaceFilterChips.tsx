import React, { useMemo } from 'react';
import { useVoter } from '../context/VoterContext';
import type { Contest } from '../types';

export function getContestShortName(c: Contest): string {
  if (c.office.includes('Amendment A')) return 'Amendment A';
  if (c.office.includes('Amendment B')) return 'Amendment B';
  if (c.id === 'us-house-1') return 'U.S. House';
  if (c.id === 'ut-senate-1') return 'Utah Senate';
  if (c.id === 'ut-house-6') return 'Utah House';
  if (c.id === 'usbe-1') return 'State Board of Ed';
  if (c.id === 'besd-7') return 'School Board';
  if (c.id === 'commission-a') return 'Commission A';
  if (c.id === 'commission-b') return 'Commission B';
  if (c.id === 'sheriff') return 'Sheriff';
  if (c.id === 'clerk') return 'Clerk';
  if (c.id === 'attorney') return 'County Attorney';
  if (c.id === 'auditor') return 'County Auditor';
  return c.office;
}

interface RaceFilterChipsProps {
  className?: string;
  compact?: boolean;
}

export const RaceFilterChips: React.FC<RaceFilterChipsProps> = ({
  className = '',
  compact = false,
}) => {
  const { contests, issues, settings, toggleRaceFilter, clearRaceFilter } = useVoter();
  const activeRaceFilter = settings.raceFilter || [];

  // Contests that have at least one issue associated with them
  const contestsWithIssues = useMemo(() => {
    return contests.filter((c) => issues.some((i) => i.contestIds.includes(c.id)));
  }, [contests, issues]);

  const isAllActive = activeRaceFilter.length === 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
          Filter by Race {activeRaceFilter.length > 0 && `(${activeRaceFilter.length} selected)`}:
        </label>
        {!isAllActive && (
          <button
            type="button"
            onClick={clearRaceFilter}
            className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline"
          >
            Reset to all races
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* All Races Chip */}
        <button
          type="button"
          onClick={clearRaceFilter}
          className={`rounded-lg font-semibold transition-all ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
          } ${
            isAllActive
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          All Races
        </button>

        {/* Contest Multi-select Chips */}
        {contestsWithIssues.map((c) => {
          const isSelected = activeRaceFilter.includes(c.id);
          const issueCount = issues.filter((i) => i.contestIds.includes(c.id)).length;
          const shortName = getContestShortName(c);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleRaceFilter(c.id)}
              className={`rounded-lg font-semibold transition-all flex items-center gap-1 ${
                compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
              } ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-2xs border border-stone-900'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              <span>{shortName}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full ${
                  isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {issueCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
