import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ResearchStatusBadge } from '../components/ResearchStatusBadge';
import { ContestRadar, CANDIDATE_PALETTE } from '../components/ContestRadar';
import {
  relation,
  formatStanceLabel,
  calculateContestCloseness,
  type ComparisonRelation,
} from '../lib/compare';
import type { Candidate, Issue } from '../types';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
  const {
    contests,
    candidateMap,
    issueMap,
    positionsByCandidate,
    sourceMap,
    answers,
    settings,
    setIncludePartyAssumed,
    answeredCount,
  } = useVoter();

  const { contestId } = useParams<{ contestId?: string }>();
  const navigate = useNavigate();

  // Find contest with candidates
  const candidateContests = useMemo(
    () => contests.filter((c) => c.type === 'candidate' && c.candidateIds.length > 0),
    [contests]
  );

  // Contest selection derives reactively from route param /compare/:contestId (defaults to first contest)
  const currentContest = useMemo(() => {
    if (contestId) {
      const found = contests.find((c) => c.id === contestId);
      if (found) return found;
    }
    return candidateContests[0];
  }, [contests, contestId, candidateContests]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minImportance, setMinImportance] = useState<number>(0);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  const contestCandidates = useMemo(() => {
    if (!currentContest) return [];
    return currentContest.candidateIds
      .map((id) => candidateMap.get(id))
      .filter((k): k is Candidate => Boolean(k));
  }, [currentContest, candidateMap]);

  const contestIssues = useMemo(() => {
    if (!currentContest) return [];
    return currentContest.issueIds
      .map((id) => issueMap.get(id))
      .filter((i): i is Issue => Boolean(i));
  }, [currentContest, issueMap]);

  // Categories in this contest
  const categories = useMemo(() => {
    const set = new Set<string>();
    contestIssues.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [contestIssues]);

  // Filtered issues for the side-by-side table
  const filteredIssues = useMemo(() => {
    return contestIssues.filter((issue) => {
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
        return false;
      }
      const ans = answers[issue.id];
      const imp = ans?.importance ?? 0;
      if (imp < minImportance) {
        return false;
      }
      return true;
    });
  }, [contestIssues, selectedCategory, minImportance, answers]);

  // Party-assumed check: hide toggle if zero party-assumed positions exist for relevant candidates
  const hasPartyAssumedInContest = useMemo(() => {
    return contestCandidates.some((cand) => {
      const posList = positionsByCandidate.get(cand.id) || [];
      return posList.some((p) => p.evidenceType === 'party-assumed');
    });
  }, [contestCandidates, positionsByCandidate]);

  // Calculate closeness and ranked candidates
  const closenessData = useMemo(() => {
    return calculateContestCloseness({
      contestIssues,
      candidates: contestCandidates,
      positionsByCandidate,
      answers,
      sourceMap,
      includePartyAssumed: settings.includePartyAssumed,
    });
  }, [
    contestIssues,
    contestCandidates,
    positionsByCandidate,
    answers,
    sourceMap,
    settings.includePartyAssumed,
  ]);

  const formatDirectionBadge = (rel: ComparisonRelation) => {
    switch (rel) {
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
      case 'no-opinion':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
            No opinion
          </span>
        );
      case 'unanswered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
            You haven&rsquo;t answered
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-400">
            <HelpCircle className="w-3.5 h-3.5" /> Unknown
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Compare Candidates by Contest
        </h1>
        <p className="mt-1 text-sm text-stone-600 max-w-3xl leading-relaxed">
          Inspect candidates side by side on specific ballot questions. View verified stances, documented evidence, and see how their records align with your answers.
        </p>
      </div>

      {answeredCount === 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-teal-700 shrink-0" />
            <p className="text-xs sm:text-sm text-teal-900 font-medium">
              You haven&rsquo;t answered any ballot questions yet. Take the quick questionnaire to see your stance compared in the table.
            </p>
          </div>
          <Link
            to="/explore"
            className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-white font-semibold text-xs whitespace-nowrap hover:bg-teal-900 self-start sm:self-auto"
          >
            Answer questions &rarr;
          </Link>
        </div>
      )}

      {/* Contest Selector Bar: Reactive Route Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
          Choose a Race to Compare:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {candidateContests.map((c) => {
            const isSelected = c.id === currentContest?.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  navigate(`/compare/${c.id}`);
                }}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isSelected ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {c.group}
                </span>
                <span className="font-bold text-xs sm:text-sm block leading-snug truncate mt-0.5">
                  {c.office}
                </span>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-[11px] block ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}>
                    {c.candidateIds.length} candidate{c.candidateIds.length === 1 ? '' : 's'}
                  </span>
                  {c.uncontested && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-800'
                    }`}>
                      Unopposed
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {currentContest && (
        <div className="space-y-6">
          {/* Unopposed Race Context Notice */}
          {currentContest.uncontested && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-100 border border-stone-200 text-xs sm:text-sm text-stone-800 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-xs uppercase tracking-wider">
                  Unopposed Race
                </span>
                <span>Office Context & Record</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                This race is unopposed ({contestCandidates[0]?.name || 'The candidate'} has no challenger on the ballot). Issues and stances for this office are shown below as background context for their upcoming term rather than a competitive matchup.
              </p>
            </div>
          )}

          {/* SVG Radar Chart (Item a) */}
          {contestCandidates.length > 0 && contestIssues.length > 0 && (
            <ContestRadar
              contestIssues={contestIssues}
              candidates={contestCandidates}
              positionsByCandidate={positionsByCandidate}
              answers={answers}
              includePartyAssumed={settings.includePartyAssumed}
            />
          )}

          {/* Section: Closest match to your answers (Item b) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Closest match to your answers
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order based on verified public stances matching issues you prioritized. Independent and nonpartisan; never a voting directive.
                </p>
              </div>
            </div>

            {closenessData.answeredRelevant === 0 ? (
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-3">
                <Compass className="w-6 h-6 text-stone-400 mx-auto" />
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                  You haven&rsquo;t answered any of the questions relevant to this race yet. Answer issues to view which candidates align closest with your views.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                          {/* Horizontal Closeness Bar & Coverage Note */}
                          <div className="mt-3 space-y-1.5">
                            {res.isRanked ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-stone-700">Closeness score</span>
                                  <span className="font-extrabold text-stone-900">
                                    {Math.round((res.score ?? 0) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.round((res.score ?? 0) * 100)}%`,
                                      backgroundColor: palette.stroke,
                                    }}
                                  />
                                </div>
                                <div className="text-[11px] text-stone-600 font-medium">
                                  Based on {res.counted} of {res.answeredRelevant} issues you answered &middot; {res.unknownCount} unknown
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-stone-400">Closeness score</span>
                                  <span className="inline-block px-2 py-0.5 rounded bg-stone-200 text-stone-600 text-[11px] font-semibold">
                                    Not enough info
                                  </span>
                                </div>
                                <div className="w-full bg-stone-200/60 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-stone-300 h-full rounded-full" style={{ width: '0%' }} />
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  Based on {res.counted} of {res.answeredRelevant} issues you answered &middot; {res.unknownCount} unknown
                                </div>
                              </div>
                            )}

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

                        {/* Expandable Trace Trigger */}
                        <div className="pt-2 border-t border-stone-200/70">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCandidateId(isExpanded ? null : res.candidate.id)
                            }
                            className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-stone-950 py-1 transition-colors"
                          >
                            <span>{isExpanded ? 'Hide issue trace' : 'View issue trace'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded Per-Issue Trace Card */}
                {expandedCandidateId && (
                  (() => {
                    const expandedRes = closenessData.results.find(
                      (r) => r.candidate.id === expandedCandidateId
                    );
                    if (!expandedRes) return null;

                    return (
                      <div className="p-4 sm:p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                          <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                            Issue-by-issue trace: {expandedRes.candidate.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setExpandedCandidateId(null)}
                            className="text-xs text-stone-500 hover:text-stone-800"
                          >
                            Close trace &times;
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          {expandedRes.traces.map((trace) => (
                            <div
                              key={trace.issueId}
                              className="p-3 rounded-lg bg-white border border-stone-200 space-y-1.5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <Link
                                  to={`/issues/${trace.issueId}`}
                                  className="font-bold text-stone-900 hover:underline"
                                >
                                  {trace.issue.question}
                                </Link>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {formatDirectionBadge(trace.relation)}
                                  <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    Priority: {trace.importance}/5
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-700 pt-1">
                                <div>
                                  <span className="font-semibold text-stone-500 block">Your stance:</span>
                                  <span>{trace.userStanceLabel}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-stone-500 block">Their stance:</span>
                                  <span>{trace.candidateStanceLabel}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100 text-[11px] text-stone-500">
                                <div>
                                  {trace.closeness !== null ? (
                                    <span>
                                      Closeness: <strong>{Math.round(trace.closeness * 100)}%</strong> (weight contribution: {trace.weightedContribution?.toFixed(2)})
                                    </span>
                                  ) : (
                                    <span className="italic">Excluded from score calculation</span>
                                  )}
                                </div>
                                {trace.sources.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span>Evidence:</span>
                                    {trace.sources.map((s) => (
                                      <a
                                        key={s.id}
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-stone-700 underline hover:text-stone-900 inline-flex items-center gap-0.5 mr-1"
                                      >
                                        {s.publisher || 'Source'}
                                        <ExternalLink className="w-2.5 h-2.5 inline" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Footnote notes */}
                <div className="text-[11px] text-stone-500 space-y-0.5 pt-1">
                  <p>
                    <strong>Note:</strong> Unset priority defaults to 3 (Moderately important). Priority 0 issues are excluded.
                  </p>
                  <p>
                    A candidate is ranked only if public positions exist for at least 2 issues and at least 50% of the issues you answered; otherwise shown as &ldquo;Not enough info&rdquo;.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Thresholds Legend Card per Brief Item 1 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-700 space-y-1">
            <span className="font-bold text-stone-900 block">Stance Comparison Thresholds:</span>
            <p className="leading-relaxed">
              <strong className="text-emerald-800">Agree:</strong> same side or within one step. &middot;{' '}
              <strong className="text-stone-800">Partial:</strong> one of you is in the middle. &middot;{' '}
              <strong className="text-rose-800">Differ:</strong> two or more steps apart on opposite sides.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-stone-600">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Min Importance */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-stone-600">Min Priority:</span>
                <select
                  value={minImportance}
                  onChange={(e) => setMinImportance(Number(e.target.value))}
                  className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800"
                >
                  <option value={0}>Any priority</option>
                  <option value={2}>Somewhat (2+) or higher</option>
                  <option value={3}>Moderately (3+) or higher</option>
                  <option value={4}>Very (4+) or higher</option>
                  <option value={5}>Essential (5) only</option>
                </select>
              </div>
            </div>

            {/* Party Assumption Toggle (hidden when zero party-assumed positions exist for relevant candidates) */}
            {hasPartyAssumedInContest && (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.includePartyAssumed}
                  onChange={(e) => setIncludePartyAssumed(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Include party-based assumptions</span>
              </label>
            )}
          </div>

          {/* Side by Side Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200">
              <h2 className="text-base font-bold text-stone-900">
                {currentContest.uncontested
                  ? 'Candidate Positions & Office Issues Context'
                  : 'Your Views vs. Their Documented Positions'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentContest.uncontested
                  ? 'Candidate documented positions on key office issues shown as background context.'
                  : 'Unknown candidate positions never count toward agree or differ. Party assumptions are excluded unless the toggle is on.'}
              </p>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 italic">
                No issues match your current filters. Try setting Min Priority to &ldquo;Any&rdquo;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                      <th className="p-3.5 min-w-[240px]">Ballot Question</th>
                      <th className="p-3.5 min-w-[150px]">Your Stance &amp; Priority</th>
                      {contestCandidates.map((c) => (
                        <th key={c.id} className="p-3.5 min-w-[200px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{c.name}</span>
                            {currentContest.uncontested && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                                Unopposed
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-normal text-stone-500">
                            {c.party || 'Nonpartisan'}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredIssues.map((issue) => {
                      const userAns = answers[issue.id];
                      const userStance = userAns && userAns.status === 'answered' ? userAns.stance : null;
                      const userImportance = userAns?.importance;

                      return (
                        <tr key={issue.id} className="hover:bg-stone-50/50 transition-colors">
                          {/* Issue Question */}
                          <td className="p-3.5 align-top">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                              {issue.category}
                            </span>
                            <Link
                              to={`/issues/${issue.id}`}
                              className="font-bold text-stone-900 hover:text-stone-700 hover:underline leading-snug block"
                            >
                              {issue.question}
                            </Link>
                          </td>

                          {/* User Stance */}
                          <td className="p-3.5 align-top">
                            {userAns && userAns.status === 'answered' && userStance !== null ? (
                              <div className="space-y-1">
                                <span className="font-semibold text-teal-800 block text-xs">
                                  {formatStanceLabel(userStance, issue)}
                                </span>
                                {userImportance !== null && userImportance !== undefined && (
                                  <span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    Priority: {userImportance}/5
                                  </span>
                                )}
                              </div>
                            ) : userAns && userAns.status === 'no-opinion' ? (
                              <span className="text-stone-500 font-medium italic">No opinion</span>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-stone-500 italic block">You haven&rsquo;t answered</span>
                                <Link
                                  to="/explore"
                                  className="text-teal-700 hover:underline font-semibold text-[11px] inline-flex items-center gap-0.5"
                                >
                                  Answer now &rarr;
                                </Link>
                              </div>
                            )}
                          </td>

                          {/* Candidate Positions */}
                          {contestCandidates.map((cand) => {
                            const candPositions = positionsByCandidate.get(cand.id) || [];
                            const pos = candPositions.find((p) => p.issueId === issue.id);
                            const rel = relation(userAns, pos, {
                              includePartyAssumed: settings.includePartyAssumed,
                            });

                            if (!pos || pos.position === null || pos.evidenceType === 'unknown') {
                              return (
                                <td key={cand.id} className="p-3.5 align-top text-stone-400">
                                  <div className="space-y-1">
                                    {formatDirectionBadge('unknown')}
                                    <p className="text-[11px] text-stone-500 italic mt-1">
                                      No public position found
                                    </p>
                                  </div>
                                </td>
                              );
                            }

                            if (pos.evidenceType === 'party-assumed' && !settings.includePartyAssumed) {
                              return (
                                <td key={cand.id} className="p-3.5 align-top text-stone-400">
                                  <div className="space-y-1">
                                    {formatDirectionBadge('assumed-excluded')}
                                    <p className="text-[11px] text-stone-500 italic mt-1">
                                      Estimated from party platform (toggle off)
                                    </p>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={cand.id} className="p-3.5 align-top space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {formatDirectionBadge(rel)}
                                  <EvidenceBadge type={pos.evidenceType} />
                                </div>

                                <div className="font-semibold text-stone-800 text-[11px] leading-snug">
                                  Stance:{' '}
                                  <span className="font-medium">
                                    {formatStanceLabel(pos.position, issue)}
                                  </span>
                                </div>

                                <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-3">
                                  {pos.summary}
                                </p>

                                {pos.sourceIds && pos.sourceIds.length > 0 && (
                                  <div className="pt-0.5">
                                    {pos.sourceIds.map((sid) => {
                                      const s = sourceMap.get(sid);
                                      return s ? (
                                        <a
                                          key={sid}
                                          href={s.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] text-stone-500 hover:text-stone-800 underline inline-flex items-center gap-0.5 mr-2"
                                        >
                                          {s.publisher || 'Source'}
                                          <ExternalLink className="w-2.5 h-2.5 inline" />
                                        </a>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
