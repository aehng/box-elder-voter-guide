import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Issue, Candidate, Position, UserAnswer } from '../types';
import { MiniPositionChart } from './MiniPositionChart';
import { formatStanceLabel } from '../lib/compare';
import { Eye, EyeOff, Info, Compass } from 'lucide-react';

export interface ContestRadarProps {
  contestIssues: Issue[];
  candidates: Candidate[];
  positionsByCandidate: Map<string, Position[]>;
  answers: Record<string, UserAnswer>;
  includePartyAssumed: boolean;
  className?: string;
}

// Colorblind-safe, non-party color palette (Okabe-Ito / Tol inspired; no red/blue party bias)
export const CANDIDATE_PALETTE = [
  {
    id: 'teal',
    stroke: '#0d9488',
    fill: 'rgba(13, 148, 136, 0.15)',
    bg: 'bg-teal-600',
    border: 'border-teal-600',
    text: 'text-teal-700',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    id: 'amber',
    stroke: '#d97706',
    fill: 'rgba(217, 119, 6, 0.15)',
    bg: 'bg-amber-600',
    border: 'border-amber-600',
    text: 'text-amber-700',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'purple',
    stroke: '#7c3aed',
    fill: 'rgba(124, 58, 237, 0.15)',
    bg: 'bg-violet-600',
    border: 'border-violet-600',
    text: 'text-violet-700',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  {
    id: 'fuchsia',
    stroke: '#c026d3',
    fill: 'rgba(192, 38, 211, 0.15)',
    bg: 'bg-fuchsia-600',
    border: 'border-fuchsia-600',
    text: 'text-fuchsia-700',
    badge: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
  },
  {
    id: 'emerald',
    stroke: '#059669',
    fill: 'rgba(5, 150, 105, 0.15)',
    bg: 'bg-emerald-600',
    border: 'border-emerald-600',
    text: 'text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'sky',
    stroke: '#0284c7',
    fill: 'rgba(2, 132, 199, 0.15)',
    bg: 'bg-sky-600',
    border: 'border-sky-600',
    text: 'text-sky-700',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
  },
];

// Short issue names for radar spokes (readable at 390px)
const SHORT_TITLES: Record<string, string> = {
  'water-great-salt-lake-and-data-center': 'Water & Salt Lake',
  'affordability-housing-and-tax-policy': 'Housing & Taxes',
  'federal-deficits-and-spending': 'Deficits & Spending',
  'government-ethics-and-election-reform': 'Ethics & Elections',
  'energy-reliability-and-environment': 'Energy & Grid',
  'fair-voting-maps': 'Voting Maps',
  'water-conservation-and-agriculture': 'Water & Ag',
  'taxes-and-affordability': 'Tax Relief',
  'stratos-data-center-and-mida': 'Stratos / MIDA',
  'starter-housing-and-growth': 'Starter Housing',
  'farm-water-rights-and-conservation': 'Farm Water Rights',
  'tax-transparency-and-affordability': 'Tax Transparency',
  'government-accountability': 'Accountability',
  'utah-fits-all-public-funding': 'Utah Fits All',
  'sensitive-materials-removal': 'School Materials',
  'school-immigration-enforcement': 'Immigration & Schools',
  'third-grade-reading-retention': '3rd Grade Reading',
  'bell-to-bell-cellphone-policy': 'Cellphone Policy',
  'property-tax-increase-and-budget': 'Tax & Budget',
  'facilities-and-school-configuration': 'School Facilities',
  'secondary-grading-and-graduation': 'Grading Standards',
  'teacher-pay-and-workplace-support': 'Teacher Pay',
  'phones-and-state-testing': 'Phones & Testing',
  'stratos-approval-and-oversight': 'Stratos Oversight',
  'water-and-resource-planning': 'Water & Resources',
  'development-tax-and-public-benefit': 'Dev Incentives',
  'county-budget-and-property-taxes': 'County Budget',
  'dispatch-reliability-and-governance': 'Dispatch Reliability',
  'sheriff-management-accountability': 'Sheriff Oversight',
  'public-safety-budget-and-staffing': 'Safety & Staffing',
  'critical-incident-and-dispatch-practices': 'Incident Practices',
  'election-administration-and-access': 'Election Access',
  'election-transparency-and-records': 'Election Records',
  'election-readiness-and-resources': 'Election Readiness',
  'prosecution-and-victim-services': 'Prosecution & Victims',
  'legal-review-and-independence': 'Legal Independence',
  'county-legal-risk-and-disclosure': 'Legal Risk',
  'budget-transparency-and-fiscal-control': 'Budget Transparency',
  'property-tax-administration-and-relief': 'Tax Relief Admin',
  'budget-reserves-and-service-costs': 'Budget Reserves',
  'fraud-and-mismanagement-reporting': 'Fraud Reporting',
  'amendment-a-publication-method': 'Amendment A',
  'amendment-b-tax-initiative-threshold': 'Amendment B',
};

function getShortIssueName(issue: Issue): string {
  if (SHORT_TITLES[issue.id]) {
    return SHORT_TITLES[issue.id];
  }
  // Fallback: derive title from id
  return issue.id
    .split('-')
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const ContestRadar: React.FC<ContestRadarProps> = ({
  contestIssues,
  candidates,
  positionsByCandidate,
  answers,
  includePartyAssumed,
  className = '',
}) => {
  // Only issues the user ANSWERED with stance not null (skip unanswered / no-opinion)
  const answeredIssues = useMemo(() => {
    return contestIssues.filter((issue) => {
      const a = answers[issue.id];
      return a && a.status === 'answered' && a.stance !== null && a.stance !== undefined;
    });
  }, [contestIssues, answers]);

  // Candidates visibility toggle state
  const [hiddenCandidateIds, setHiddenCandidateIds] = useState<Record<string, boolean>>({});
  // Selected spoke for detailed inspection below radar
  const [selectedSpokeIndex, setSelectedSpokeIndex] = useState<number | null>(null);

  const toggleCandidate = (candId: string) => {
    setHiddenCandidateIds((prev) => ({
      ...prev,
      [candId]: !prev[candId],
    }));
  };

  // If fewer than 3 answered issues: don't draw radar; show fallback horizontal dot lines
  if (answeredIssues.length < 3) {
    return (
      <div className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Race Alignment Radar
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Multi-axis visual mapping of candidate positions alongside your stances.
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors self-start sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5 text-teal-200" />
            Answer more issues &rarr;
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Answer at least 3 issues in this race to see the radar view.
            </p>
            <p className="text-amber-800 text-xs">
              {answeredIssues.length === 0
                ? 'You have not answered any issues for this contest yet.'
                : `You have answered ${answeredIssues.length} of ${contestIssues.length} issues in this race. Answer ${3 - answeredIssues.length} more to unlock the radar chart.`}
            </p>
          </div>
        </div>

        {answeredIssues.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Your Answered Issues in This Race
            </h4>
            <div className="space-y-3">
              {answeredIssues.map((issue) => (
                <MiniPositionChart
                  key={issue.id}
                  issueId={issue.id}
                  userStance={answers[issue.id]?.stance}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Radar SVG Geometry
  const N = answeredIssues.length;
  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 150; // leaves 100px padding around perimeter for axis labels
  const unknownR = 16; // center ring radius reserved for unknown

  // Angles: spoke 0 at 12 o'clock (-PI/2), moving clockwise
  const angles = answeredIssues.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / N);

  // Radius map: stance -2..+2 mapped to >0 radius: r = ((v + 3) / 5) * maxR
  // -2 -> 0.20 * maxR (30px)
  // -1 -> 0.40 * maxR (60px)
  //  0 -> 0.60 * maxR (90px)
  // +1 -> 0.80 * maxR (120px)
  // +2 -> 1.00 * maxR (150px)
  const getRadius = (stance: number): number => {
    return ((stance + 3) / 5) * maxR;
  };

  const getPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  // Concentric polygon ring points
  const ringStances = [-2, -1, 0, 1, 2];
  const concentricPolygons = ringStances.map((stance) => {
    const r = getRadius(stance);
    const pointsStr = angles
      .map((ang) => {
        const pt = getPoint(ang, r);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
    return { stance, radius: r, pointsStr };
  });

  // Center unknown ring polygon
  const unknownRingPointsStr = angles
    .map((ang) => {
      const pt = getPoint(ang, unknownR);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  // User polygon points (user has answered all N issues)
  const userPoints = answeredIssues.map((issue, i) => {
    const uStance = answers[issue.id].stance as number;
    const r = getRadius(uStance);
    return { ...getPoint(angles[i], r), stance: uStance, issueId: issue.id };
  });
  const userPolygonStr = userPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Candidate polygons / polylines calculation
  const candidateData = candidates.map((cand, candIdx) => {
    const palette = CANDIDATE_PALETTE[candIdx % CANDIDATE_PALETTE.length];
    const candPositions = positionsByCandidate.get(cand.id) || [];

    // Evaluate each spoke
    const spokePoints = answeredIssues.map((issue, i) => {
      const posObj = candPositions.find((p) => p.issueId === issue.id);
      const isPartyAssumed = posObj?.evidenceType === 'party-assumed';
      const isIncluded = isPartyAssumed
        ? includePartyAssumed
        : Boolean(posObj && posObj.position !== null && posObj.evidenceType !== 'unknown');
      const isKnown = Boolean(posObj && posObj.position !== null && isIncluded);

      if (isKnown) {
        const v = posObj!.position as number;
        const r = getRadius(v);
        const pt = getPoint(angles[i], r);
        return {
          spokeIndex: i,
          isKnown: true,
          isPartyAssumed,
          stance: v,
          x: pt.x,
          y: pt.y,
          posObj,
        };
      } else {
        // Unknown or excluded assumed -> placed at center ring
        const pt = getPoint(angles[i], unknownR);
        return {
          spokeIndex: i,
          isKnown: false,
          isPartyAssumed: false,
          stance: null,
          x: pt.x,
          y: pt.y,
          posObj,
        };
      }
    });

    const isVisible = !hiddenCandidateIds[cand.id];

    // Build contiguous segments of known points for polylines:
    // If all N spokes are known: closed polygon
    // Else: break into separate polyline chains
    const allKnown = spokePoints.every((p) => p.isKnown);

    let polylines: Array<{
      pointsStr: string;
      segments: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        isPartyAssumed: boolean;
      }>;
      points: typeof spokePoints;
    }> = [];

    if (allKnown) {
      const pts = [...spokePoints, spokePoints[0]];
      const segments = [];
      for (let j = 0; j < pts.length - 1; j++) {
        segments.push({
          x1: pts[j].x,
          y1: pts[j].y,
          x2: pts[j + 1].x,
          y2: pts[j + 1].y,
          isPartyAssumed: pts[j].isPartyAssumed || pts[j + 1].isPartyAssumed,
        });
      }
      polylines.push({
        pointsStr: spokePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        segments,
        points: spokePoints,
      });
    } else {
      // Find a start index that is unknown to properly collect circular runs
      const firstUnknown = spokePoints.findIndex((p) => !p.isKnown);
      const runs: Array<typeof spokePoints> = [];
      let currentRun: typeof spokePoints = [];

      for (let step = 0; step < N; step++) {
        const idx = (firstUnknown + step) % N;
        const pt = spokePoints[idx];
        if (pt.isKnown) {
          currentRun.push(pt);
        } else {
          if (currentRun.length > 0) {
            runs.push(currentRun);
            currentRun = [];
          }
        }
      }
      if (currentRun.length > 0) {
        runs.push(currentRun);
      }

      polylines = runs.map((run) => {
        const segments = [];
        for (let j = 0; j < run.length - 1; j++) {
          segments.push({
            x1: run[j].x,
            y1: run[j].y,
            x2: run[j + 1].x,
            y2: run[j + 1].y,
            isPartyAssumed: run[j].isPartyAssumed || run[j + 1].isPartyAssumed,
          });
        }
        return {
          pointsStr: run.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
          segments,
          points: run,
        };
      });
    }

    return {
      candidate: cand,
      palette,
      spokePoints,
      isVisible,
      allKnown,
      polylines,
    };
  });

  const activeSpoke = selectedSpokeIndex !== null ? answeredIssues[selectedSpokeIndex] : null;

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">
            Race Alignment Radar
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Compare candidate stances against your answers on {answeredIssues.length} issues in this race.
          </p>
        </div>

        <div className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 self-start sm:self-auto">
          Center ring = Unknown &middot; Outer = Strongly Agree/Right
        </div>
      </div>

      {/* Legend with Candidate Toggle Chips (Wraps on mobile) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {/* User Chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-stone-900 text-white shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 rotate-45 shrink-0" />
          <span>You</span>
        </div>

        {/* Candidate Chips */}
        {candidateData.map(({ candidate, palette, isVisible }) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => toggleCandidate(candidate.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isVisible
                ? `${palette.badge} shadow-2xs`
                : 'bg-stone-100 text-stone-400 border-stone-200 opacity-60 line-through'
            }`}
            title={`Click to ${isVisible ? 'hide' : 'show'} ${candidate.name}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: isVisible ? palette.stroke : '#9ca3af' }}
            />
            <span className="truncate max-w-[140px] sm:max-w-none">{candidate.name}</span>
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 opacity-60 shrink-0" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 opacity-60 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Radar SVG Container */}
      <div className="relative w-full max-w-[460px] mx-auto select-none">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto overflow-visible"
          aria-label="Candidate alignment radar chart"
          role="img"
        >
          {/* Background Concentric Web Polygons */}
          <g className="grid-rings">
            {concentricPolygons.map(({ stance, pointsStr }) => {
              const isMiddle = stance === 0;
              return (
                <polygon
                  key={stance}
                  points={pointsStr}
                  fill={isMiddle ? 'rgba(245, 245, 244, 0.4)' : 'none'}
                  stroke={isMiddle ? '#cbd5e1' : '#e7e5e4'}
                  strokeWidth={isMiddle ? 1.5 : 1}
                  strokeDasharray={stance === -2 ? '3 3' : undefined}
                />
              );
            })}

            {/* Unknown Center Ring */}
            <polygon
              points={unknownRingPointsStr}
              fill="rgba(241, 245, 249, 0.6)"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </g>

          {/* Spoke Axes */}
          <g className="spoke-lines">
            {angles.map((ang, i) => {
              const outerPt = getPoint(ang, maxR);
              const innerPt = getPoint(ang, unknownR);
              const isSelected = selectedSpokeIndex === i;

              return (
                <line
                  key={i}
                  x1={innerPt.x}
                  y1={innerPt.y}
                  x2={outerPt.x}
                  y2={outerPt.y}
                  stroke={isSelected ? '#0d9488' : '#e2e8f0'}
                  strokeWidth={isSelected ? 2 : 1}
                />
              );
            })}
          </g>

          {/* Scale Marker Ring Labels along top spoke */}
          <g className="scale-markers" fontSize="9" fill="#94a3b8" textAnchor="middle">
            <text x={cx} y={cy - unknownR - 3} className="font-mono text-[8px] fill-stone-400">
              unk
            </text>
            <text x={cx} y={cy - getRadius(-2) + 3} className="font-semibold fill-stone-500">
              -2
            </text>
            <text x={cx} y={cy - getRadius(0) + 3} className="font-semibold fill-stone-600">
              0
            </text>
            <text x={cx} y={cy - getRadius(2) + 3} className="font-semibold fill-stone-500">
              +2
            </text>
          </g>

          {/* Candidate Polygons & Lines (Rendered Under User Polygon) */}
          {candidateData.map(
            ({ candidate, palette, spokePoints, isVisible, allKnown, polylines }) => {
              if (!isVisible) return null;

              return (
                <g key={candidate.id} className={`candidate-radar-${candidate.id}`}>
                  {/* If all spokes known, draw translucent filled polygon */}
                  {allKnown && polylines[0] && (
                    <polygon
                      points={polylines[0].pointsStr}
                      fill={palette.fill}
                      stroke="none"
                    />
                  )}

                  {/* Draw polyline segments */}
                  {polylines.map((poly, polyIdx) => (
                    <g key={polyIdx}>
                      {poly.segments.map((seg, sIdx) => (
                        <line
                          key={sIdx}
                          x1={seg.x1}
                          y1={seg.y1}
                          x2={seg.x2}
                          y2={seg.y2}
                          stroke={palette.stroke}
                          strokeWidth={2}
                          strokeDasharray={seg.isPartyAssumed ? '4 4' : undefined}
                          strokeLinecap="round"
                        />
                      ))}
                    </g>
                  ))}

                  {/* Vertices & Hollow Unknown Points */}
                  {spokePoints.map((sp, spIdx) => {
                    if (sp.isKnown) {
                      return (
                        <g key={spIdx}>
                          <circle
                            cx={sp.x}
                            cy={sp.y}
                            r={sp.isPartyAssumed ? 4 : 4.5}
                            fill={sp.isPartyAssumed ? '#ffffff' : palette.stroke}
                            stroke={palette.stroke}
                            strokeWidth={sp.isPartyAssumed ? 2 : 1.5}
                            strokeDasharray={sp.isPartyAssumed ? '2 2' : undefined}
                          >
                            <title>
                              {candidate.name}: {formatStanceLabel(sp.stance, answeredIssues[spIdx])}
                              {sp.isPartyAssumed ? ' (Party-assumed)' : ' (Verified)'}
                            </title>
                          </circle>
                        </g>
                      );
                    } else {
                      // Hollow point at center ring marked "unknown"
                      return (
                        <circle
                          key={spIdx}
                          cx={sp.x}
                          cy={sp.y}
                          r={3.5}
                          fill="#ffffff"
                          stroke={palette.stroke}
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        >
                          <title>{candidate.name}: Unknown / No public stance</title>
                        </circle>
                      );
                    }
                  })}
                </g>
              );
            }
          )}

          {/* User Polygon (Drawn Distinct and on Top) */}
          <g className="user-polygon">
            <polygon
              points={userPolygonStr}
              fill="rgba(15, 23, 42, 0.12)"
              stroke="#0f172a"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {userPoints.map((p, i) => (
              <g key={i}>
                <rect
                  x={p.x - 4}
                  y={p.y - 4}
                  width={8}
                  height={8}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  transform={`rotate(45 ${p.x} ${p.y})`}
                >
                  <title>You: {formatStanceLabel(p.stance, answeredIssues[i])}</title>
                </rect>
              </g>
            ))}
          </g>

          {/* Axis Labels (Short issue names, clickable/tappable to inspect) */}
          <g className="axis-labels">
            {answeredIssues.map((issue, i) => {
              const ang = angles[i];
              const labelRadius = maxR + 24;
              const labelPt = getPoint(ang, labelRadius);
              const shortName = getShortIssueName(issue);
              const isSelected = selectedSpokeIndex === i;

              // Anchor logic based on cosine
              const cos = Math.cos(ang);
              let textAnchor: 'middle' | 'start' | 'end' = 'middle';
              if (cos > 0.25) textAnchor = 'start';
              else if (cos < -0.25) textAnchor = 'end';

              // Dy adjustment based on sine
              const sin = Math.sin(ang);
              const dy = sin > 0.3 ? '0.8em' : sin < -0.3 ? '-0.2em' : '0.35em';

              return (
                <g
                  key={issue.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedSpokeIndex(isSelected ? null : i)}
                >
                  <circle
                    cx={labelPt.x}
                    cy={labelPt.y}
                    r={18}
                    fill="transparent"
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    dy={dy}
                    textAnchor={textAnchor}
                    className={`text-[11px] font-bold transition-colors ${
                      isSelected
                        ? 'fill-teal-700 underline font-extrabold'
                        : 'fill-stone-700 group-hover:fill-stone-950'
                    }`}
                  >
                    {shortName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Scale ends and interactive spoke inspector */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-900 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-500" />
            {activeSpoke ? 'Issue Details & Scale Ends:' : 'Tap any issue label or choose one below:'}
          </span>
          {activeSpoke && (
            <button
              type="button"
              onClick={() => setSelectedSpokeIndex(null)}
              className="text-stone-500 hover:text-stone-800 text-[11px] underline"
            >
              Reset selection
            </button>
          )}
        </div>

        {/* Issue Quick Selection Chips */}
        <div className="flex flex-wrap gap-1.5">
          {answeredIssues.map((issue, idx) => {
            const isSelected = selectedSpokeIndex === idx;
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedSpokeIndex(isSelected ? null : idx)}
                className={`px-2 py-0.8 rounded text-[11px] font-medium border transition-colors ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {getShortIssueName(issue)}
              </button>
            );
          })}
        </div>

        {/* Active Spoke Detailed Scale & Comparison */}
        {activeSpoke ? (
          <div className="space-y-2 pt-2 border-t border-stone-200/80 text-xs animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                {activeSpoke.category}
              </span>
              <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5">
                {activeSpoke.question}
              </p>
            </div>

            {/* Scale ends labeled */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-stone-200 text-[11px]">
              <div>
                <span className="font-bold text-stone-500 block uppercase text-[10px]">
                  Left Scale End (-2)
                </span>
                <span className="text-stone-800 font-medium">{activeSpoke.leftLabel}</span>
              </div>
              <div>
                <span className="font-bold text-teal-800 block uppercase text-[10px]">
                  Right Scale End (+2)
                </span>
                <span className="text-stone-800 font-medium">{activeSpoke.rightLabel}</span>
              </div>
            </div>

            {/* User Stance vs Candidates on this spoke */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] p-2 rounded bg-stone-900 text-white font-medium">
                <span>Your Stance:</span>
                <span className="font-bold text-teal-300">
                  {formatStanceLabel(answers[activeSpoke.id]?.stance, activeSpoke)}
                </span>
              </div>

              {candidates.map((cand, cIdx) => {
                const palette = CANDIDATE_PALETTE[cIdx % CANDIDATE_PALETTE.length];
                const candPositions = positionsByCandidate.get(cand.id) || [];
                const pos = candPositions.find((p) => p.issueId === activeSpoke.id);
                const isPartyAssumed = pos?.evidenceType === 'party-assumed';
                const isIncluded = isPartyAssumed
                  ? includePartyAssumed
                  : Boolean(pos && pos.position !== null && pos.evidenceType !== 'unknown');
                const isKnown = Boolean(pos && pos.position !== null && isIncluded);

                return (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between text-[11px] p-2 rounded bg-white border border-stone-200"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: palette.stroke }}
                      />
                      <span className="font-semibold text-stone-900">{cand.name}</span>
                      <span className="text-stone-500 text-[10px]">({cand.party || 'Nonpartisan'})</span>
                    </div>

                    <div>
                      {isKnown ? (
                        <span className="font-medium text-stone-800">
                          {formatStanceLabel(pos!.position, activeSpoke)}
                          {isPartyAssumed && (
                            <span className="ml-1 text-[10px] text-amber-700 italic">
                              (Party-assumed)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">No public stance</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-stone-500">
            Click any issue above or on the radar chart to inspect the Left/Right scale ends and candidate comparisons for that specific issue.
          </div>
        )}
      </div>
    </div>
  );
};
