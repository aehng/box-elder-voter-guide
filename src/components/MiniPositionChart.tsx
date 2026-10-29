import React, { useState } from 'react';
import { useVoter } from '../context/VoterContext';
import type { UserStance, Position } from '../types';
import { EvidenceBadge } from './EvidenceBadge';
import { formatStanceLabel } from '../lib/compare';

interface MiniPositionChartProps {
  issueId: string;
  userStance?: UserStance;
  className?: string;
}

export const MiniPositionChart: React.FC<MiniPositionChartProps> = ({
  issueId,
  userStance,
  className = '',
}) => {
  const { positionsByIssue, candidateMap, issueMap, settings } = useVoter();
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  const issue = issueMap.get(issueId);
  const rawPositions = positionsByIssue.get(issueId) || [];

  // Filter positions according to settings
  const knownPositions: Array<{
    pos: Position;
    candidateName: string;
    party: string;
    initials: string;
    isAssumed: boolean;
  }> = [];

  const unknownCandidates: string[] = [];

  for (const p of rawPositions) {
    const cand = candidateMap.get(p.candidateId);
    if (!cand) continue;

    const isAssumed = p.evidenceType === 'party-assumed';

    if (p.position === null || (isAssumed && !settings.includePartyAssumed)) {
      unknownCandidates.push(cand.name);
    } else {
      const parts = cand.name.trim().split(/\s+/);
      const initials = parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : parts[0].slice(0, 2);

      knownPositions.push({
        pos: p,
        candidateName: cand.name,
        party: cand.party || 'Nonpartisan',
        initials: initials.toUpperCase(),
        isAssumed,
      });
    }
  }

  // SVG dimensions
  const width = 600;
  const height = 96;
  const paddingX = 45;
  const axisY = 48;

  const getX = (val: number) => {
    const norm = (val + 2) / 4;
    return paddingX + norm * (width - 2 * paddingX);
  };

  // Group candidates by position value to stack them nicely
  const groupedByPos = new Map<number, typeof knownPositions>();
  for (const item of knownPositions) {
    const val = item.pos.position!;
    const list = groupedByPos.get(val) || [];
    list.push(item);
    groupedByPos.set(val, list);
  }

  const activeItem = activeCandidateId
    ? knownPositions.find((k) => k.pos.candidateId === activeCandidateId)
    : null;

  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-4 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Where Candidates Stand
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-700"></span> Candidate
          </span>
          {settings.includePartyAssumed && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-500 bg-white"></span> Assumed
            </span>
          )}
          {userStance !== undefined && userStance !== null && (
            <span className="inline-flex items-center gap-1 font-medium text-teal-800">
              <span className="w-2.5 h-2.5 rotate-45 bg-teal-600"></span> You
            </span>
          )}
        </div>
      </div>

      {/* Axis Ends Labels using real issue labels */}
      {issue && (
        <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-stone-700 mb-1.5">
          <div className="text-left pr-2 leading-snug">
            {issue.leftLabel}
          </div>
          <div className="text-right pl-2 leading-snug">
            {issue.rightLabel}
          </div>
        </div>
      )}

      {knownPositions.length === 0 && (userStance === undefined || userStance === null) ? (
        <p className="text-xs text-stone-500 py-3 italic">
          No public candidate positions recorded yet on this specific issue.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-36 overflow-visible select-none"
            aria-label="Spectrum chart showing candidate positions and user stance"
          >
            {/* Background track line */}
            <line
              x1={paddingX}
              y1={axisY}
              x2={width - paddingX}
              y2={axisY}
              stroke="#e7e5e4"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Middle divider mark */}
            <line
              x1={getX(0)}
              y1={axisY - 8}
              x2={getX(0)}
              y2={axisY + 8}
              stroke="#a8a29e"
              strokeWidth="1.5"
            />

            {/* Position Tick Marks (dots only, no generic -2/+2 numbers) */}
            {[-2, -1, 0, 1, 2].map((tick) => {
              const x = getX(tick);
              return (
                <g key={tick}>
                  <circle cx={x} cy={axisY} r="3" fill="#a8a29e" />
                </g>
              );
            })}

            {/* Candidate Dots (rendered first) */}
            {Array.from(groupedByPos.entries()).map(([posVal, candidatesAtPos]) => {
              const baseX = getX(posVal);
              return candidatesAtPos.map((cand, idx) => {
                // Stack vertically if multiple candidates share position
                const offsetY = idx === 0 ? 0 : idx % 2 === 1 ? -18 * Math.ceil(idx / 2) : 18 * Math.ceil(idx / 2);
                const finalY = axisY + offsetY;
                const isAssumed = cand.isAssumed;
                const isSelected = activeCandidateId === cand.pos.candidateId;

                return (
                  <g
                    key={cand.pos.candidateId}
                    transform={`translate(${baseX}, ${finalY})`}
                    onClick={() =>
                      setActiveCandidateId(
                        activeCandidateId === cand.pos.candidateId ? null : cand.pos.candidateId
                      )
                    }
                    className="cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`${cand.candidateName}: position ${cand.pos.position}`}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="12"
                      fill={isAssumed ? '#ffffff' : isSelected ? '#1c1917' : '#44403c'}
                      stroke={isAssumed ? '#78716c' : '#ffffff'}
                      strokeWidth="2"
                      strokeDasharray={isAssumed ? '3 2' : undefined}
                      opacity={isAssumed ? 0.6 : 1}
                      className="transition-transform group-hover:scale-110 shadow-xs"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className={`text-[9px] font-bold ${
                        isAssumed ? 'fill-stone-600' : 'fill-white'
                      }`}
                      opacity={isAssumed ? 0.7 : 1}
                    >
                      {cand.initials}
                    </text>
                  </g>
                );
              });
            })}

            {/* User marker (rendered LAST on top, visually distinct) */}
            {userStance !== undefined && userStance !== null && (
              <g transform={`translate(${getX(userStance)}, ${axisY})`}>
                <circle cx="0" cy="0" r="14" fill="#0d9488" fillOpacity="0.25" />
                <polygon
                  points="0,-16 10,0 0,16 -10,0"
                  fill="#0f766e"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="filter drop-shadow-sm"
                />
                <polygon points="0,-6 4,0 0,6 -4,0" fill="#ffffff" />
                <rect
                  x="-14"
                  y="-29"
                  width="28"
                  height="13"
                  rx="3"
                  fill="#0f766e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="-20"
                  textAnchor="middle"
                  className="text-[8.5px] fill-white font-extrabold tracking-wider"
                >
                  YOU
                </text>
              </g>
            )}
          </svg>

          {/* Active tooltip / candidate inspection */}
          {activeItem && (
            <div className="mt-2 p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-stone-900">
                  {activeItem.candidateName} ({activeItem.party})
                </span>
                <EvidenceBadge type={activeItem.pos.evidenceType} />
              </div>
              {issue && (
                <div className="text-[11px] font-semibold text-stone-800">
                  Stance: {formatStanceLabel(activeItem.pos.position, issue)}
                </div>
              )}
              <p className="text-stone-600">{activeItem.pos.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Unknown Candidates list */}
      {unknownCandidates.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-stone-600">No public position found:</span>
          {unknownCandidates.map((name) => (
            <span key={name} className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
