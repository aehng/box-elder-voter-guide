import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ResearchStatusBadge } from '../components/ResearchStatusBadge';
import type { Candidate, Issue, AlignmentDirection } from '../types';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
  Compass,
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
    getAlignment,
    answeredCount,
  } = useVoter();

  const [searchParams, setSearchParams] = useSearchParams();

  // Find contest with candidates
  const candidateContests = useMemo(
    () => contests.filter((c) => c.type === 'candidate' && c.candidateIds.length > 0),
    [contests]
  );

  const initialContestId = searchParams.get('contest') || candidateContests[0]?.id || '';
  const [selectedContestId, setSelectedContestId] = useState<string>(initialContestId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minImportance, setMinImportance] = useState<number>(0);

  const currentContest = useMemo(
    () => contests.find((c) => c.id === selectedContestId) || candidateContests[0],
    [contests, selectedContestId, candidateContests]
  );

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

  // Filtered issues
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

  const formatDirectionBadge = (dir: AlignmentDirection) => {
    switch (dir) {
      case 'agree':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Agree
          </span>
        );
      case 'differ':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900">
            <XCircle className="w-3.5 h-3.5" /> Differ
          </span>
        );
      case 'middle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700">
            <MinusCircle className="w-3.5 h-3.5" /> Middle
          </span>
        );
      case 'assumed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-500 border border-dashed border-stone-300">
            Assumed
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
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-teal-700 shrink-0" />
            <p className="text-xs sm:text-sm text-teal-900 font-medium">
              You haven&rsquo;t answered any ballot questions yet. Take the quick questionnaire to see your stance compared in the table.
            </p>
          </div>
          <Link
            to="/explore"
            className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-white font-semibold text-xs whitespace-nowrap hover:bg-teal-900"
          >
            Answer questions &rarr;
          </Link>
        </div>
      )}

      {/* Contest Selector Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <label htmlFor="contest-select" className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
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
                  setSelectedContestId(c.id);
                  setSearchParams({ contest: c.id });
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
                <span className={`text-[11px] block mt-1 ${
                  isSelected ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {c.candidateIds.length} candidate{c.candidateIds.length === 1 ? '' : 's'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {currentContest && (
        <div className="space-y-6">
          {/* Candidates Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestCandidates.map((cand) => {
              const candPositions = positionsByCandidate.get(cand.id) || [];

              // Calculate per-contest alignment counts
              let agreeCount = 0;
              let differCount = 0;
              let middleCount = 0;
              let unknownCount = 0;
              let assumedCount = 0;

              for (const issue of contestIssues) {
                const ans = answers[issue.id];
                const uStance = ans && ans.status === 'answered' ? ans.stance : null;
                const pos = candPositions.find((p) => p.issueId === issue.id);

                const align = getAlignment(uStance, pos);
                if (align === 'agree') agreeCount++;
                else if (align === 'differ') differCount++;
                else if (align === 'middle') middleCount++;
                else if (align === 'assumed') assumedCount++;
                else unknownCount++;
              }

              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        to={`/candidate/${cand.id}`}
                        className="text-base font-bold text-stone-900 hover:text-stone-700 hover:underline"
                      >
                        {cand.name}
                      </Link>
                      {cand.incumbent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                          Incumbent
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-500 font-medium mb-3">
                      {cand.party || 'Nonpartisan'}
                    </div>

                    {cand.background && cand.background.length > 0 && (
                      <ul className="text-xs text-stone-600 space-y-1 mb-4 list-disc pl-4">
                        {cand.background.slice(0, 2).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Alignment counts note: NO single score, NO winner */}
                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <ResearchStatusBadge status={cand.researchStatus} />
                      <Link
                        to={`/candidate/${cand.id}`}
                        className="text-xs font-semibold text-stone-700 hover:underline"
                      >
                        Profile &rarr;
                      </Link>
                    </div>

                    {answeredCount > 0 ? (
                      <div className="bg-stone-50 rounded-xl p-2.5 text-xs text-stone-700 space-y-1 border border-stone-200">
                        <span className="font-semibold text-stone-900 block text-[11px] uppercase tracking-wider">
                          Your alignment counts:
                        </span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          <span className="text-emerald-800 font-semibold">
                            {agreeCount} agree
                          </span>
                          <span className="text-amber-800 font-semibold">
                            {differCount} differ
                          </span>
                          {middleCount > 0 && (
                            <span className="text-stone-600">{middleCount} middle</span>
                          )}
                          <span className="text-stone-500">{unknownCount} unknown</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-500 italic">
                        Answer questions to calculate alignment counts.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

            {/* Party Assumption Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={settings.includePartyAssumed}
                onChange={(e) => setIncludePartyAssumed(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Include party-based assumptions</span>
            </label>
          </div>

          {/* Side by Side Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200">
              <h2 className="text-base font-bold text-stone-900">
                Your Views vs. Their Documented Positions
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Unknown stances never count toward agree or differ. Party assumptions are excluded unless the toggle is on.
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
                      <th className="p-3.5 min-w-[150px]">Your Stance & Priority</th>
                      {contestCandidates.map((c) => (
                        <th key={c.id} className="p-3.5 min-w-[200px]">
                          <div>{c.name}</div>
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
                                <span className="font-semibold text-teal-800 block">
                                  {userStance > 0 ? `+${userStance}` : userStance}
                                </span>
                                <span className="text-[11px] text-stone-600 block line-clamp-2">
                                  {userStance === -2
                                    ? issue.leftLabel
                                    : userStance === 2
                                    ? issue.rightLabel
                                    : userStance === 0
                                    ? 'Middle ground'
                                    : userStance < 0
                                    ? `Lean ${issue.leftLabel}`
                                    : `Lean ${issue.rightLabel}`}
                                </span>
                                {userImportance !== null && userImportance !== undefined && (
                                  <span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    Priority: {userImportance}/5
                                  </span>
                                )}
                              </div>
                            ) : userAns && userAns.status === 'no-opinion' ? (
                              <span className="text-stone-400 italic">No opinion</span>
                            ) : (
                              <Link
                                to="/explore"
                                className="text-teal-700 hover:underline font-medium text-[11px]"
                              >
                                Answer now &rarr;
                              </Link>
                            )}
                          </td>

                          {/* Candidate Positions */}
                          {contestCandidates.map((cand) => {
                            const candPositions = positionsByCandidate.get(cand.id) || [];
                            const pos = candPositions.find((p) => p.issueId === issue.id);
                            const align = getAlignment(userStance, pos);

                            if (!pos || pos.position === null) {
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
                                    {formatDirectionBadge('assumed')}
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
                                  {userStance !== null && formatDirectionBadge(align)}
                                  <EvidenceBadge type={pos.evidenceType} />
                                </div>

                                <div className="font-semibold text-stone-800">
                                  Stance: {pos.position > 0 ? `+${pos.position}` : pos.position}
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
