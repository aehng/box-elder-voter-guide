import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import type { Issue, UserAnswer, Position, UserStance, UserImportance } from '../types';
import { EvidenceBadge } from './EvidenceBadge';
import { formatStanceLabel } from '../lib/compare';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface IssuePositionChartProps {
  issue: Issue;
  answer: UserAnswer;
  className?: string;
}

export const IssuePositionChart: React.FC<IssuePositionChartProps> = ({
  issue,
  answer,
  className = '',
}) => {
  const { positionsByIssue, candidateMap, sourceMap, settings, setAnswer } = useVoter();
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const rawPositions = positionsByIssue.get(issue.id) || [];

  const knownCandidates: Array<{
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

      knownCandidates.push({
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
  const height = 110;
  const paddingX = 40;
  const axisY = 55;

  const getX = (val: number) => {
    const norm = (val + 2) / 4;
    return paddingX + norm * (width - 2 * paddingX);
  };

  // Group by position
  const groupedByPos = new Map<number, typeof knownCandidates>();
  for (const item of knownCandidates) {
    const val = item.pos.position!;
    const list = groupedByPos.get(val) || [];
    list.push(item);
    groupedByPos.set(val, list);
  }

  const activeCandItem = activeCandidateId
    ? knownCandidates.find((k) => k.pos.candidateId === activeCandidateId)
    : null;

  const importanceLabels = ['Not important', 'Slightly', 'Somewhat', 'Moderately', 'Very', 'Essential'];

  const stops: Array<{ val: UserStance; label: string }> = [
    { val: -2, label: formatStanceLabel(-2, issue) },
    { val: -1, label: formatStanceLabel(-1, issue) },
    { val: 0, label: formatStanceLabel(0, issue) },
    { val: 1, label: formatStanceLabel(1, issue) },
    { val: 2, label: formatStanceLabel(2, issue) },
  ];

  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-5 shadow-xs transition-shadow hover:shadow-md ${className}`}>
      {/* Header with Category & Question */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              {issue.category}
            </span>
            {answer.status === 'answered' && answer.stance !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Your stance: {formatStanceLabel(answer.stance, issue)}
              </span>
            )}
            {answer.status === 'no-opinion' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                Your stance: No opinion
              </span>
            )}
            {answer.importance !== null && answer.importance !== undefined && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Priority: {importanceLabels[answer.importance]} ({answer.importance}/5)
              </span>
            )}
          </div>
          <Link
            to={`/issues/${issue.id}`}
            className="text-base font-semibold text-stone-900 hover:text-stone-700 transition-colors inline-flex items-center gap-1.5 group"
          >
            <span>{issue.question}</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 shrink-0" />
          </Link>
        </div>

        {/* Edit inline toggle */}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 bg-stone-50 hover:bg-stone-100 transition-colors"
        >
          {isEditing ? (
            <>
              Hide controls <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Edit your stance <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Inline editable controls if expanded */}
      {isEditing && (
        <div className="mb-4 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4 animate-fadeIn">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
              <span>Adjust your stance</span>
              {answer.status === 'no-opinion' && (
                <span className="text-stone-500 italic">Currently: No opinion</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {stops.map((stop) => {
                const isSelected = answer.status === 'answered' && answer.stance === stop.val;
                return (
                  <button
                    key={String(stop.val)}
                    type="button"
                    onClick={() =>
                      setAnswer(issue.id, {
                        stance: stop.val,
                        status: 'answered',
                      })
                    }
                    className={`py-2 px-2 rounded-lg text-center text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-200'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="leading-snug">{stop.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() =>
                  setAnswer(issue.id, {
                    stance: null,
                    status: 'no-opinion',
                  })
                }
                className="text-xs text-stone-600 hover:text-stone-900 underline font-medium"
              >
                Mark as no opinion
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
              <span>Adjust priority: {importanceLabels[answer.importance ?? 3]} ({answer.importance ?? 3}/5)</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={answer.importance ?? 3}
              onChange={(e) =>
                setAnswer(issue.id, {
                  importance: Number(e.target.value) as UserImportance,
                })
              }
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />
            <div className="text-[11px] text-stone-500 mt-1">
              Unset priority defaults to 3 (Moderately important). Priority 0 answers are excluded from match scores.
            </div>
          </div>
        </div>
      )}

      {/* Axis Ends Labels using real issue labels */}
      <div className="grid grid-cols-2 gap-4 text-xs text-stone-700 mb-2 font-medium">
        <div className="text-left pr-2 leading-snug">
          {issue.leftLabel}
        </div>
        <div className="text-right pl-2 leading-snug">
          {issue.rightLabel}
        </div>
      </div>

      {/* Main SVG Spectrum */}
      <div className="relative py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-36 overflow-visible select-none"
          aria-label={`Position chart for ${issue.question}`}
        >
          {/* Main Track */}
          <line
            x1={paddingX}
            y1={axisY}
            x2={width - paddingX}
            y2={axisY}
            stroke="#e7e5e4"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Center Line */}
          <line
            x1={getX(0)}
            y1={axisY - 10}
            x2={getX(0)}
            y2={axisY + 10}
            stroke="#a8a29e"
            strokeWidth="1.5"
          />

          {/* Ticks: dots at each stop */}
          {[-2, -1, 0, 1, 2].map((tick) => {
            const x = getX(tick);
            return (
              <g key={tick}>
                <circle cx={x} cy={axisY} r="3" fill="#a8a29e" />
              </g>
            );
          })}

          {/* Candidate Circles (rendered FIRST so YOU marker is always on top) */}
          {Array.from(groupedByPos.entries()).map(([posVal, cands]) => {
            const baseX = getX(posVal);
            return cands.map((cand, idx) => {
              // Offset vertically so candidates at the same stop stack cleanly in rows
              const offsetY = idx === 0 ? 0 : idx % 2 === 1 ? -24 * Math.ceil(idx / 2) : 24 * Math.ceil(idx / 2);
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
                  aria-label={`${cand.candidateName}: ${cand.pos.position}`}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="13"
                    fill={isAssumed ? '#ffffff' : isSelected ? '#1c1917' : '#44403c'}
                    stroke={isAssumed ? '#78716c' : '#ffffff'}
                    strokeWidth="2"
                    strokeDasharray={isAssumed ? '3 2' : undefined}
                    opacity={isAssumed ? 0.6 : 1}
                    className="transition-transform group-hover:scale-115 shadow-xs"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    className={`text-[9.5px] font-bold ${
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

          {/* User Marker (rendered LAST on top of candidates, visually distinct) */}
          {answer.status === 'answered' && answer.stance !== null && (
            <g transform={`translate(${getX(answer.stance)}, ${axisY})`}>
              {/* Outer soft glow ring */}
              <circle cx="0" cy="0" r="16" fill="#0d9488" fillOpacity="0.25" />
              {/* Main high-contrast diamond */}
              <polygon
                points="0,-16 11,0 0,16 -11,0"
                fill="#0f766e"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="filter drop-shadow-sm"
              />
              <polygon points="0,-7 5,0 0,7 -5,0" fill="#ffffff" />
              {/* Distinct YOU badge */}
              <rect
                x="-16"
                y="-33"
                width="32"
                height="15"
                rx="4"
                fill="#0f766e"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="-22"
                textAnchor="middle"
                className="text-[9.5px] fill-white font-extrabold tracking-wider"
              >
                YOU
              </text>
            </g>
          )}
        </svg>

        {/* Selected Candidate Detail Popout */}
        {activeCandItem && (
          <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1.5 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-stone-900 text-sm">
                {activeCandItem.candidateName}
                <span className="text-stone-500 font-normal ml-1.5">({activeCandItem.party})</span>
              </span>
              <div className="flex items-center gap-2">
                <EvidenceBadge type={activeCandItem.pos.evidenceType} />
                <Link
                  to={`/candidate/${activeCandItem.pos.candidateId}`}
                  className="text-teal-700 hover:underline font-medium ml-1"
                >
                  View profile &rarr;
                </Link>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-stone-800">
              Stance: {formatStanceLabel(activeCandItem.pos.position, issue)}
            </div>
            <p className="text-stone-700 leading-relaxed">{activeCandItem.pos.summary}</p>
            {activeCandItem.pos.sourceIds && activeCandItem.pos.sourceIds.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[11px] text-stone-500 pt-1">
                <span className="font-medium">Sources:</span>
                {activeCandItem.pos.sourceIds.map((sid) => {
                  const s = sourceMap.get(sid);
                  return s ? (
                    <a
                      key={sid}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-600 hover:text-stone-900 underline inline-flex items-center gap-0.5"
                    >
                      {s.title}
                      <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unknown Candidates Row */}
      {unknownCandidates.length > 0 && (
        <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <span className="font-medium text-stone-600">No public position found:</span>
          {unknownCandidates.map((name) => (
            <span
              key={name}
              className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[11px]"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
