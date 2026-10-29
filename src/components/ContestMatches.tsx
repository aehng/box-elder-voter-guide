import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Contest, Issue, Candidate, Position, Source, UserAnswer } from '../types';
import { ResearchStatusBadge } from './ResearchStatusBadge';
import { ContestRadar, CANDIDATE_PALETTE } from './ContestRadar';
import { ErrorBoundary } from './ErrorBoundary';
import {
  calculateContestCloseness,
  getShortIssueName,
  type CandidateIssueTrace,
} from '../lib/compare';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
  Compass,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export interface ContestMatchesProps {
  contest: Contest;
  contestIssues: Issue[];
  candidates: Candidate[];
  positionsByCandidate: Map<string, Position[]>;
  answers: Record<string, UserAnswer>;
  sourceMap?: Map<string, Source>;
  includePartyAssumed?: boolean;
  showFullComparisonLink?: boolean;
  className?: string;
}

export const ContestMatches: React.FC<ContestMatchesProps> = ({
  contest,
  contestIssues,
  candidates,
  positionsByCandidate,
  answers,
  sourceMap,
  includePartyAssumed = false,
  showFullComparisonLink = false,
  className = '',
}) => {
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // Calculate closeness and ranked candidates
  const closenessData = useMemo(() => {
    return calculateContestCloseness({
      contestIssues,
      candidates,
      positionsByCandidate,
      answers,
      sourceMap,
      includePartyAssumed,
    });
  }, [
    contestIssues,
    candidates,
    positionsByCandidate,
    answers,
    sourceMap,
    includePartyAssumed,
  ]);

  const renderResultChip = (trace: CandidateIssueTrace) => {
    if (trace.userStatus === 'no-opinion') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
          No opinion
        </span>
      );
    }
    switch (trace.relation) {
      case 'agree':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Agree
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            <MinusCircle className="w-3.5 h-3.5" /> Partial
          </span>
        );
      case 'differ':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-900">
            <XCircle className="w-3.5 h-3.5" /> Differ
          </span>
        );
      case 'assumed-excluded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-500 border border-dashed border-stone-300">
            Assumed
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-500">
            <HelpCircle className="w-3.5 h-3.5" /> Unknown
          </span>
        );
    }
  };

  return (
    <ErrorBoundary fallbackTitle={`Error displaying matches for ${contest.office}`}>
      <div className={`space-y-6 ${className}`}>
        {/* Contest Title & Full Comparison Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              {contest.group}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              {contest.office}
            </h2>
          </div>
          {showFullComparisonLink && (
            <Link
              to={`/compare/${contest.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 hover:text-teal-950 font-semibold text-xs sm:text-sm shrink-0 transition-colors"
            >
              <span>Full comparison</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Unopposed Race Notice */}
        {contest.uncontested && (
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-100 border border-stone-200 text-xs sm:text-sm text-stone-800 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-900 font-bold">
              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-xs uppercase tracking-wider">
                Unopposed Race
              </span>
              <span>Office Context & Record</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              This race is unopposed ({candidates[0]?.name || 'The candidate'} has no challenger on the ballot). Issues and stances for this office are shown below as background context for their upcoming term rather than a competitive matchup.
            </p>
          </div>
        )}

        {/* SVG Radar Chart */}
        {candidates.length > 0 && contestIssues.length > 0 && (
          <ContestRadar
            contestIssues={contestIssues}
            candidates={candidates}
            positionsByCandidate={positionsByCandidate}
            answers={answers}
            includePartyAssumed={Boolean(includePartyAssumed)}
          />
        )}

        {/* Closeness Section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight">
                Closest match to your answers
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Order based on verified public stances matching issues you prioritized. Independent and nonpartisan; never a voting directive.
              </p>
            </div>
          </div>

          {closenessData.totalAnsweredInContest === 0 ? (
            <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-3">
              <Compass className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                Answer issues in this race to see the comparison
              </p>
              <div>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Answer ballot questions &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {closenessData.results.map((res, candIdx) => {
                  const isExpanded = expandedCandidateId === res.candidate.id;
                  const palette = CANDIDATE_PALETTE[candIdx % CANDIDATE_PALETTE.length];

                  return (
                    <div
                      key={res.candidate.id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span
                              className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                              style={{ backgroundColor: palette.stroke }}
                              title={`${res.candidate.name} chart color`}
                            />
                            <div>
                              <Link
                                to={`/candidate/${res.candidate.id}`}
                                className="font-bold text-stone-900 hover:underline text-sm block leading-tight"
                              >
                                {res.candidate.name}
                              </Link>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {res.candidate.party || 'Nonpartisan'}
                              </span>
                            </div>
                          </div>
                          <ResearchStatusBadge status={res.candidate.researchStatus} />
                        </div>

                        {/* Horizontal Closeness Bar & Confidence Line */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-700">Closeness score</span>
                            {res.counted >= 1 ? (
                              <span className="font-extrabold text-stone-900">
                                {Math.round((res.score ?? 0) * 100)}%
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[11px] font-semibold">
                                No data on your issues
                              </span>
                            )}
                          </div>

                          <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: res.counted >= 1 ? `${Math.round((res.score ?? 0) * 100)}%` : '0%',
                                backgroundColor: palette.stroke,
                              }}
                            />
                          </div>

                          {/* Confidence line with warning icon if coverage < 60% */}
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
                            {res.isLowCoverage && (
                              <span title="Coverage under 60% of answered issues" className="inline-flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                            <span className="leading-tight">
                              {res.counted >= 1 ? (
                                <>
                                  {Math.round((res.score ?? 0) * 100)}% match on {res.counted} compared issue{res.counted === 1 ? '' : 's'}
                                  {res.unknownCount > 0 && ` \u00b7 ${res.unknownCount} issue${res.unknownCount === 1 ? '' : 's'} with no data (unconfirmed)`}
                                </>
                              ) : (
                                <>
                                  {res.answeredRelevant > 0
                                    ? `${res.answeredRelevant} issue${res.answeredRelevant === 1 ? '' : 's'} with no data (unconfirmed)`
                                    : 'No data on your issues'}
                                </>
                              )}
                            </span>
                          </div>

                          {/* Summary Counts using relation() */}
                          <div className="pt-2 text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              <span className="text-emerald-800 font-semibold">
                                {res.agreeCount} agree
                                {res.weightedAgree > 0 && ` (wt: ${res.weightedAgree})`}
                              </span>
                              <span>&middot;</span>
                              <span className="text-stone-700 font-medium">{res.partialCount} partial</span>
                              <span>&middot;</span>
                              <span className="text-rose-800 font-semibold">
                                {res.differCount} differ
                                {res.weightedDiffer > 0 && ` (wt: ${res.weightedDiffer})`}
                              </span>
                            </div>
                            <Link
                              to={`/candidate/${res.candidate.id}`}
                              className="text-xs font-semibold text-teal-800 hover:underline"
                            >
                              Profile &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Issue by issue Toggle Trigger */}
                      <div className="pt-2 border-t border-stone-200/70">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCandidateId(isExpanded ? null : res.candidate.id)
                          }
                          className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-stone-950 py-1 transition-colors"
                        >
                          <span>Issue by issue</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Expanded Issue by issue rows inside candidate card */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-200 space-y-2.5 animate-fadeIn">
                            {res.traces.length === 0 ? (
                              <div className="p-3 bg-white rounded-lg border border-stone-200 text-center text-xs text-stone-600">
                                <span>Answer issues in this race to see the comparison</span>
                                <div className="mt-1">
                                  <Link
                                    to="/explore"
                                    className="text-teal-800 underline font-semibold text-xs"
                                  >
                                    Go to Explore &rarr;
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              res.traces.map((trace) => {
                                const shortName = getShortIssueName(trace.issue);
                                const isNoOp = trace.userStatus === 'no-opinion';

                                return (
                                  <div
                                    key={trace.issueId}
                                    className="p-3 rounded-lg bg-white border border-stone-200 space-y-1.5 text-xs text-left"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <span className="font-bold text-stone-900 block leading-tight">
                                          {shortName}
                                        </span>
                                        <span className="text-[11px] text-stone-500 line-clamp-1">
                                          {trace.issue.question}
                                        </span>
                                      </div>
                                      <div className="shrink-0">
                                        {renderResultChip(trace)}
                                      </div>
                                    </div>

                                    {/* Stacked mobile-friendly rows */}
                                    <div className="space-y-1 pt-1 text-[11px] text-stone-700">
                                      <div>
                                        <span className="font-semibold text-stone-900">You: </span>
                                        {isNoOp ? (
                                          <span className="text-stone-500 italic">No opinion - not counted</span>
                                        ) : (
                                          <span>
                                            {trace.userStanceLabel}{' '}
                                            <span className="text-stone-500">
                                              ({trace.importance === 0 ? 'Priority: 0 - Excluded' : `Priority: ${trace.importance}/5`})
                                            </span>
                                          </span>
                                        )}
                                      </div>

                                      <div>
                                        <span className="font-semibold text-stone-900">Them: </span>
                                        <span>{trace.candidateStanceLabel}</span>
                                        {trace.candPosObj?.evidenceType && (
                                          <span className="text-stone-500 text-[10px] ml-1">
                                            ({trace.candPosObj.evidenceType}
                                            {trace.candPosObj.confidence ? ` \u00b7 ${trace.candPosObj.confidence} confidence` : ''})
                                          </span>
                                        )}
                                        {!trace.candPosObj && res.candidate.researchStatus && (
                                          <span className="text-stone-500 text-[10px] ml-1">
                                            ({res.candidate.researchStatus} research)
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Source links if present */}
                                    {trace.sources.length > 0 && (
                                      <div className="pt-1 border-t border-stone-100 flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500">
                                        <span className="font-medium text-stone-600">Source:</span>
                                        {trace.sources.map((s) => (
                                          <a
                                            key={s.id}
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-800 underline hover:text-teal-950 inline-flex items-center gap-0.5 mr-1"
                                          >
                                            {s.publisher || s.title || 'Source'}
                                            <ExternalLink className="w-2.5 h-2.5 inline" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footnote notes */}
              <div className="text-[11px] text-stone-500 space-y-0.5 pt-1">
                <p>
                  <strong>Scoring methodology:</strong> Closeness is importance-weighted over issues you answered with priority &gt; 0 where candidate positions exist. Unset priority defaults to 3 (Moderately important).
                </p>
                <p>
                  Missing candidate data does not lower a candidate&rsquo;s score. Candidates with fewer than 60% of your answered issues documented are marked with a coverage notice.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
