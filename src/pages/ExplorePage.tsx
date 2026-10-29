import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { PositionSlider } from '../components/PositionSlider';
import { ImportanceSlider } from '../components/ImportanceSlider';
import { MiniPositionChart } from '../components/MiniPositionChart';
import { RaceFilterChips } from '../components/RaceFilterChips';
import { formatStanceLabel } from '../lib/compare';
import type { UserStance, UserImportance, UserAnswerStatus, Issue, Contest } from '../types';
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
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const {
    issues,
    contests,
    contestMap,
    answers,
    setAnswer,
    sourceMap,
    settings,
    setGroupBy,
    clearRaceFilter,
  } = useVoter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const activeRaceFilter = settings.raceFilter || [];
  const groupBy = settings.groupBy || 'category';

  // Filter issues whose contestIds intersect the active raceFilter (empty = all)
  const filteredIssues = useMemo(() => {
    if (activeRaceFilter.length === 0) return issues;
    return issues.filter((issue) =>
      issue.contestIds.some((cid) => activeRaceFilter.includes(cid))
    );
  }, [issues, activeRaceFilter]);

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

  // Group issues by category for jump list, surfacing Constitutional Amendments as their own section
  const categoryGroups = useMemo(() => {
    const map = new Map<string, Array<{ issue: Issue; index: number }>>();
    filteredIssues.forEach((issue, index) => {
      const isAmendment = issue.contestIds.some(
        (cid) => contestMap.get(cid)?.group === 'amendments'
      );
      const categoryName = isAmendment ? 'Constitutional Amendments' : issue.category;
      const list = map.get(categoryName) || [];
      list.push({ issue, index });
      map.set(categoryName, list);
    });
    return Array.from(map.entries());
  }, [filteredIssues, contestMap]);

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Filter and Grouping Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          {/* Group By Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">Group by:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-stone-100 border border-stone-200">
              <button
                type="button"
                onClick={() => setGroupBy('category')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  groupBy === 'category'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('race')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  groupBy === 'race'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ballot race
              </button>
            </div>
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Showing {filteredIssues.length} question{filteredIssues.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Race Filter Chips */}
        <RaceFilterChips compact />
      </div>

      {/* Top Progress & Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-200 text-stone-800">
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

                {currentIndex < issues.length - 1 ? (
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
                    <span>View my results</span>
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

        {/* Desktop Sidebar / Jump List (4 cols) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Ballot Questions</h3>
              <span className="text-xs text-stone-500 font-medium">
                {filteredAnsweredCount} of {filteredIssues.length} answered
              </span>
            </div>

            <div className="space-y-4">
              {groupBy === 'category' ? (
                categoryGroups.map(([cat, items]) => (
                  <div key={cat} className="space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 py-0.5">
                      {cat}
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
                                  —
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
                ))
              ) : (
                raceGroups.map(({ contest, items }) => (
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
                                  —
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
                ))
              )}
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

      {/* Mobile Drawer / Sheet for Questions Jump List */}
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

            {/* Mobile Drawer Group By Toggle */}
            <div className="pt-3 pb-2 flex items-center justify-between gap-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-600">Group by:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-stone-100 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setGroupBy('category')}
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    groupBy === 'category' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  Category
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy('race')}
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    groupBy === 'race' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  Ballot race
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {groupBy === 'category' ? (
                categoryGroups.map(([cat, items]) => (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2">
                      {cat}
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
                ))
              ) : (
                raceGroups.map(({ contest, items }) => (
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
                ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Link
                to="/my-views"
                onClick={() => setShowDrawer(false)}
                className="w-full py-3 rounded-xl bg-teal-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                Go to My Views dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
