import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { PositionSlider } from '../components/PositionSlider';
import { ImportanceSlider } from '../components/ImportanceSlider';
import { MiniPositionChart } from '../components/MiniPositionChart';
import { RaceFilterChips, getContestShortName } from '../components/RaceFilterChips';
import { formatStanceLabel, calculateContestCloseness } from '../lib/compare';
import type { UserStance, UserImportance, UserAnswerStatus, Issue, Contest, Candidate } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Compass,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const {
    issues,
    contests,
    contestMap,
    candidateMap,
    issueMap,
    positionsByCandidate,
    answers,
    setAnswer,
    sourceMap,
    settings,
    clearRaceFilter,
    answeredCount,
  } = useVoter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const activeRaceFilter = settings.raceFilter || [];

  // Helper to determine contest order for an issue (minimum contest order)
  const getIssueContestOrder = (issue: Issue): number => {
    let minOrder = 9999;
    for (const cid of issue.contestIds) {
      const c = contestMap.get(cid);
      if (c && c.order < minOrder) {
        minOrder = c.order;
      }
    }
    return minOrder;
  };

  // Filter issues whose contestIds intersect the active raceFilter (empty = all)
  // Questions are grouped/ordered by ballot race
  const filteredIssues = useMemo(() => {
    const matching = activeRaceFilter.length === 0
      ? issues
      : issues.filter((issue) =>
          issue.contestIds.some((cid) => activeRaceFilter.includes(cid))
        );

    return [...matching].sort((a, b) => {
      const orderA = getIssueContestOrder(a);
      const orderB = getIssueContestOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return issues.indexOf(a) - issues.indexOf(b);
    });
  }, [issues, activeRaceFilter, contestMap]);

  // Contests that have issues
  const contestsWithIssues = useMemo(() => {
    return contests.filter((c) => issues.some((i) => i.contestIds.includes(c.id)));
  }, [contests, issues]);

  // Keep currentIndex bounded
  const safeIndex = useMemo(() => {
    if (filteredIssues.length === 0) return 0;
    return Math.min(currentIndex, filteredIssues.length - 1);
  }, [currentIndex, filteredIssues.length]);

  const currentIssue: Issue | undefined = filteredIssues[safeIndex];

  const isAmendmentIssue = currentIssue
    ? currentIssue.contestIds.some((cid) => contestMap.get(cid)?.group === 'amendments')
    : false;
  const amendmentContest = isAmendmentIssue && currentIssue
    ? currentIssue.contestIds.map((cid) => contestMap.get(cid)).find((c) => c?.type === 'amendment')
    : null;

  // Filtered progress counts
  const filteredAnsweredCount = useMemo(() => {
    return filteredIssues.filter(
      (i) => answers[i.id]?.status === 'answered' && answers[i.id]?.stance !== null
    ).length;
  }, [filteredIssues, answers]);

  const filteredSkippedCount = useMemo(() => {
    return filteredIssues.filter(
      (i) => answers[i.id]?.status === 'skipped'
    ).length;
  }, [filteredIssues, answers]);

  const progressPercent = filteredIssues.length > 0
    ? Math.round(((filteredAnsweredCount + filteredSkippedCount) / filteredIssues.length) * 100)
    : 0;

  // Group issues by Ballot race for jump list
  const raceGroups = useMemo(() => {
    const activeContests = contestsWithIssues.filter(
      (c) => activeRaceFilter.length === 0 || activeRaceFilter.includes(c.id)
    );
    const groups: Array<{ contest: Contest; items: Array<{ issue: Issue; index: number }> }> = [];
    for (const contest of activeContests) {
      const items: Array<{ issue: Issue; index: number }> = [];
      filteredIssues.forEach((issue, index) => {
        if (issue.contestIds.includes(contest.id)) {
          items.push({ issue, index });
        }
      });
      if (items.length > 0) {
        groups.push({ contest, items });
      }
    }
    return groups;
  }, [contestsWithIssues, activeRaceFilter, filteredIssues]);

  // Target candidate contest for the current issue's mini summary
  const targetContest = useMemo(() => {
    if (!currentIssue) return null;
    const candidateContests = currentIssue.contestIds
      .map((cid) => contestMap.get(cid))
      .filter((c): c is Contest => Boolean(c && c.type === 'candidate'));
    if (candidateContests.length === 0) return null;
    const filtered = candidateContests.find((c) => activeRaceFilter.includes(c.id));
    return filtered || candidateContests[0];
  }, [currentIssue, contestMap, activeRaceFilter]);

  const contestShortName = targetContest ? getContestShortName(targetContest) : '';

  // Closeness calculation for target contest
  const targetContestCloseness = useMemo(() => {
    if (!targetContest) return null;
    const contestIssues = targetContest.issueIds
      .map((id) => issueMap.get(id))
      .filter((i): i is Issue => Boolean(i));
    const contestCandidates = targetContest.candidateIds
      .map((id) => candidateMap.get(id))
      .filter((k): k is Candidate => Boolean(k));

    return calculateContestCloseness({
      contestIssues,
      candidates: contestCandidates,
      positionsByCandidate,
      answers,
      sourceMap,
      includePartyAssumed: settings.includePartyAssumed,
    });
  }, [
    targetContest,
    issueMap,
    candidateMap,
    positionsByCandidate,
    answers,
    sourceMap,
    settings.includePartyAssumed,
  ]);

  const topCandidateResult = targetContestCloseness?.results[0];
  const hasEnoughInfo = Boolean(topCandidateResult && topCandidateResult.isRanked && topCandidateResult.score !== null);

  const handleSkip = () => {
    if (!currentIssue) return;
    const curAns = answers[currentIssue.id];
    const isAns = curAns?.status === 'answered' && curAns.stance !== null;
    const isNoOp = curAns?.status === 'no-opinion';
    if (!isAns && !isNoOp) {
      setAnswer(currentIssue.id, {
        stance: null,
        importance: null,
        status: 'skipped',
      });
    }
    if (safeIndex < filteredIssues.length - 1) {
      setCurrentIndex(safeIndex + 1);
      setShowLearnMore(false);
    }
  };

  const handleNext = () => {
    if (safeIndex < filteredIssues.length - 1) {
      setCurrentIndex(safeIndex + 1);
      setShowLearnMore(false);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
      setShowLearnMore(false);
    }
  };

  if (!currentIssue || filteredIssues.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
          <Compass className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-xl font-bold text-stone-900">No questions match your race filter</h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            None of the ballot questions correspond to the selected races. Reset the race filter to view all questions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={clearRaceFilter}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-colors"
            >
              Reset to all races
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
          <RaceFilterChips />
        </div>
      </div>
    );
  }

  const currentAnswer = answers[currentIssue.id] || {
    stance: null,
    importance: 3,
    status: 'skipped' as UserAnswerStatus,
    updated: '',
  };

  const isAnswered = currentAnswer.status === 'answered' && currentAnswer.stance !== null;
  const isNoOpinion = currentAnswer.status === 'no-opinion';

  const handleStanceChange = (stance: UserStance, status: UserAnswerStatus) => {
    setAnswer(currentIssue.id, {
      stance,
      status,
      importance: currentAnswer.importance ?? 3,
    });
  };

  const handleImportanceChange = (importance: UserImportance) => {
    setAnswer(currentIssue.id, {
      importance,
      status: currentAnswer.status || 'answered',
    });
  };

  // Ballot race tag for current question
  const currentContest = currentIssue.contestIds.map((cid) => contestMap.get(cid))[0];
  const currentContestName = currentContest ? getContestShortName(currentContest) : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 sm:pb-24">
      {/* Top Race Filter Bar (Group by category toggle removed) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <span className="text-xs font-bold text-stone-700">Questions Grouped by Ballot Race</span>
          <span className="text-xs text-stone-500 font-medium">
            Showing {filteredIssues.length} question{filteredIssues.length === 1 ? '' : 's'}
          </span>
        </div>
        <RaceFilterChips compact />
      </div>

      {/* Top Progress & Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {currentContestName && (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-900 text-white">
                {currentContestName}
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {currentIssue.category}
            </span>
            <span className="text-xs font-semibold text-stone-500">
              Question {safeIndex + 1} of {filteredIssues.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Questions Jump List</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 text-[10px]">
                {filteredAnsweredCount}/{filteredIssues.length}
              </span>
            </button>
          </div>
        </div>

        {/* Progress line */}
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Questionnaire Column (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
            {isAmendmentIssue && amendmentContest && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-stone-700 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                    Statewide Constitutional Amendment
                  </span>
                  <Link
                    to={`/amendment/${amendmentContest.id}`}
                    className="text-teal-800 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    View amendment detail &rarr;
                  </Link>
                </div>
                <h3 className="font-bold text-sm text-stone-900">
                  {amendmentContest.office}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {amendmentContest.howItAffectsVoters}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {currentIssue.question}
              </h2>
              {currentIssue.background && (
                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  {currentIssue.background}
                </p>
              )}
            </div>

            {/* Side-by-side policy cards (stack on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Left Policy Card */}
              <div className="bg-stone-50 rounded-xl p-4 sm:p-5 border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-stone-500">
                      {isAmendmentIssue ? 'Vote AGAINST (Reject)' : 'Approach'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mb-3 leading-snug">
                    {currentIssue.leftLabel}
                  </h3>

                  {currentIssue.leftPros && currentIssue.leftPros.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block mb-1">
                        Arguments in favor:
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                        {currentIssue.leftPros.map((pro, idx) => (
                          <li key={idx}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentIssue.leftCons && currentIssue.leftCons.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block mb-1">
                        Drawbacks / Criticisms:
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                        {currentIssue.leftCons.map((con, idx) => (
                          <li key={idx}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Policy Card */}
              <div className="bg-stone-50 rounded-xl p-4 sm:p-5 border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-teal-800">
                      {isAmendmentIssue ? 'Vote FOR (Approve)' : 'Approach'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 mb-3 leading-snug">
                    {currentIssue.rightLabel}
                  </h3>

                  {currentIssue.rightPros && currentIssue.rightPros.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block mb-1">
                        Arguments in favor:
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                        {currentIssue.rightPros.map((pro, idx) => (
                          <li key={idx}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentIssue.rightCons && currentIssue.rightCons.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block mb-1">
                        Drawbacks / Criticisms:
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                        {currentIssue.rightCons.map((con, idx) => (
                          <li key={idx}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Learn More */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLearnMore(!showLearnMore)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
              >
                <span>Why is this live on the 2026 ballot?</span>
                {showLearnMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showLearnMore && (
                <div className="mt-3 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-3 animate-fadeIn">
                  {currentIssue.whyLive && (
                    <p className="leading-relaxed">
                      <strong>Relevance to this race:</strong> {currentIssue.whyLive}
                    </p>
                  )}

                  {currentIssue.sourceIds && currentIssue.sourceIds.length > 0 && (
                    <div className="pt-2 border-t border-stone-200">
                      <span className="font-semibold block mb-1.5 text-stone-900">
                        Documented Sources:
                      </span>
                      <ul className="space-y-1">
                        {currentIssue.sourceIds.map((sid) => {
                          const s = sourceMap.get(sid);
                          return s ? (
                            <li key={sid}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-800 hover:underline inline-flex items-center gap-1"
                              >
                                {s.title}
                                {s.publisher && <span className="text-stone-500">({s.publisher})</span>}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sliders Area */}
            <div className="space-y-4 pt-3 border-t border-stone-200">
              <PositionSlider
                value={currentAnswer.stance}
                status={currentAnswer.status}
                leftLabel={currentIssue.leftLabel}
                rightLabel={currentIssue.rightLabel}
                onChange={handleStanceChange}
              />

              <ImportanceSlider
                value={currentAnswer.importance}
                onChange={handleImportanceChange}
              />

              {/* One-line mini summary under the slider */}
              {isAnswered && targetContest && (
                <div className="pt-2">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center justify-between gap-2 animate-fadeIn">
                    <span className="truncate">
                      {hasEnoughInfo && topCandidateResult ? (
                        <>
                          Closest so far in {contestShortName}: <strong className="text-stone-900">{topCandidateResult.candidate.name}</strong> ({Math.round((topCandidateResult.score ?? 0) * 100)}%) &mdash;{' '}
                          <Link to="/my-views" className="text-teal-800 underline font-semibold hover:text-teal-950">
                            see matches
                          </Link>
                        </>
                      ) : (
                        <span className="text-stone-600">
                          Answer a few more to see matches in {contestShortName}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls: Prev, Skip, Next */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs sm:text-sm hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium text-xs sm:text-sm hover:bg-stone-50"
                >
                  Skip for now
                </button>

                {currentIndex < filteredIssues.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs sm:text-sm hover:bg-stone-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Next question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to="/my-views"
                    className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-xs sm:text-sm hover:bg-teal-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View my matches</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* After answering */}
          {(isAnswered || isNoOpinion) && (
            <div className="animate-fadeIn">
              {isAmendmentIssue && amendmentContest ? (
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Your Recorded Choice on this Amendment
                    </h4>
                    <Link
                      to={`/amendment/${amendmentContest.id}`}
                      className="text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Read full amendment analysis &rarr;
                    </Link>
                  </div>
                  <p className="text-xs text-stone-600">
                    This is a statewide constitutional amendment decided by voters. Candidates do not hold individual ballot positions on amendments in this guide.
                  </p>
                  {isAnswered && (
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>
                        Your stance: <strong>{formatStanceLabel(currentAnswer.stance, currentIssue)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <MiniPositionChart
                  issueId={currentIssue.id}
                  userStance={currentAnswer.stance}
                />
              )}
            </div>
          )}
        </div>

        {/* Desktop Sidebar / Jump List (4 cols) - Grouped by Ballot Race */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Ballot Questions</h3>
              <span className="text-xs text-stone-500 font-medium">
                {filteredAnsweredCount} of {filteredIssues.length} answered
              </span>
            </div>

            <div className="space-y-4">
              {raceGroups.map(({ contest, items }) => (
                <div key={contest.id} className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 py-0.5 truncate">
                    {contest.office}
                  </h4>
                  <div className="space-y-0.5">
                    {items.map(({ issue, index }) => {
                      const ans = answers[issue.id];
                      const isCur = index === safeIndex;
                      const answered = ans && ans.status === 'answered' && ans.stance !== null;
                      const noOp = ans && ans.status === 'no-opinion';
                      const skipped = ans && ans.status === 'skipped';

                      return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(index);
                            setShowLearnMore(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                            isCur
                              ? 'bg-stone-900 text-white font-semibold'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="truncate">
                            {index + 1}. {issue.question}
                          </span>
                          <span className="shrink-0">
                            {answered ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isCur ? 'text-teal-400' : 'text-teal-600'}`} />
                            ) : noOp ? (
                              <span className={`text-[10px] font-mono ${isCur ? 'text-stone-300' : 'text-stone-400'}`}>
                                N/O
                              </span>
                            ) : skipped ? (
                              <span className={`text-[10px] ${isCur ? 'text-stone-300' : 'text-stone-400'}`}>
                                &mdash;
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full border border-stone-300" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {filteredAnsweredCount > 0 && (
              <div className="mt-6 pt-4 border-t border-stone-100">
                <Link
                  to="/my-views"
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-stone-600" />
                  View alignment dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Sheet for Questions Jump List - Grouped by Ballot Race */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full flex flex-col p-6 shadow-2xl overflow-hidden animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Ballot Questions</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {filteredAnsweredCount} of {filteredIssues.length} questions answered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700"
                aria-label="Close jump list"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {raceGroups.map(({ contest, items }) => (
                <div key={contest.id} className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2 truncate">
                    {contest.office}
                  </h4>
                  <div className="space-y-1">
                    {items.map(({ issue, index }) => {
                      const ans = answers[issue.id];
                      const isCur = index === safeIndex;
                      const answered = ans && ans.status === 'answered' && ans.stance !== null;
                      const noOp = ans && ans.status === 'no-opinion';

                      return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(index);
                            setShowDrawer(false);
                            setShowLearnMore(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors ${
                            isCur
                              ? 'bg-stone-900 text-white font-semibold'
                              : 'text-stone-700 hover:bg-stone-100 bg-stone-50/50'
                          }`}
                        >
                          <span className="truncate">
                            {index + 1}. {issue.question}
                          </span>
                          <span className="shrink-0">
                            {answered ? (
                              <CheckCircle2 className={`w-4 h-4 ${isCur ? 'text-teal-400' : 'text-teal-600'}`} />
                            ) : noOp ? (
                              <span className="text-[10px] text-stone-400">N/O</span>
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full border border-stone-300" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Link
                to="/my-views"
                onClick={() => setShowDrawer(false)}
                className="w-full py-3 rounded-xl bg-teal-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                Go to My Matches dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Persistent sticky button linking to /my-views (above BottomNav on mobile, visible on desktop) */}
      <div className="fixed bottom-16 md:bottom-6 inset-x-0 z-30 pointer-events-none flex justify-center px-4">
        <Link
          to="/my-views"
          className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all border border-teal-700 max-w-[calc(100vw-2rem)] truncate"
        >
          <UserCheck className="w-4 h-4 text-teal-300 shrink-0" />
          <span className="truncate">See my matches ({answeredCount} answered)</span>
        </Link>
      </div>
    </div>
  );
};
