import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { IssuePositionChart } from '../components/IssuePositionChart';
import { RaceFilterChips } from '../components/RaceFilterChips';
import {
  Compass,
  GitCompare,
  RotateCcw,
} from 'lucide-react';

export const MyViewsPage: React.FC = () => {
  const {
    issues,
    answers,
    settings,
    setIncludePartyAssumed,
    resetAllAnswers,
    clearRaceFilter,
    answeredCount,
    positionsByIssue,
  } = useVoter();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const activeRaceFilter = settings.raceFilter || [];

  // Filter issues whose contestIds intersect the active raceFilter (empty = all)
  const filteredIssues = useMemo(() => {
    if (activeRaceFilter.length === 0) return issues;
    return issues.filter((issue) =>
      issue.contestIds.some((cid) => activeRaceFilter.includes(cid))
    );
  }, [issues, activeRaceFilter]);

  // Header counts reflect filtered set
  const filteredTotal = filteredIssues.length;
  const filteredAnswered = useMemo(() => {
    return filteredIssues.filter(
      (i) => answers[i.id]?.status === 'answered' && answers[i.id]?.stance !== null
    ).length;
  }, [filteredIssues, answers]);

  const filteredNoOpinion = useMemo(() => {
    return filteredIssues.filter(
      (i) => answers[i.id]?.status === 'no-opinion'
    ).length;
  }, [filteredIssues, answers]);

  const filteredSkipped = useMemo(() => {
    return Math.max(0, filteredTotal - filteredAnswered - filteredNoOpinion);
  }, [filteredTotal, filteredAnswered, filteredNoOpinion]);

  // Filter issues answered or marked no-opinion within the filtered set
  const answeredIssues = useMemo(() => {
    return filteredIssues
      .filter((i) => {
        const a = answers[i.id];
        return a && (a.status === 'answered' || a.status === 'no-opinion');
      })
      .map((issue) => ({
        issue,
        answer: answers[issue.id],
      }))
      .sort((a, b) => {
        // Sort by importance desc, then by question title
        const impA = a.answer.importance ?? -1;
        const impB = b.answer.importance ?? -1;
        if (impB !== impA) return impB - impA;
        return a.issue.question.localeCompare(b.issue.question);
      });
  }, [filteredIssues, answers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    answeredIssues.forEach(({ issue }) => set.add(issue.category));
    return Array.from(set).sort();
  }, [answeredIssues]);

  const displayedIssues = useMemo(() => {
    if (selectedCategory === 'all') return answeredIssues;
    return answeredIssues.filter(({ issue }) => issue.category === selectedCategory);
  }, [answeredIssues, selectedCategory]);

  const hasPartyAssumedInViews = useMemo(() => {
    return displayedIssues.some(({ issue }) => {
      const list = positionsByIssue.get(issue.id) || [];
      return list.some((p) => p.evidenceType === 'party-assumed');
    });
  }, [displayedIssues, positionsByIssue]);

  // Empty state if nothing answered anywhere in the guide
  if (answeredCount === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center mx-auto shadow-2xs">
          <Compass className="w-8 h-8 text-teal-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            No issues rated yet
          </h1>
          <p className="text-stone-600 text-base max-w-md mx-auto leading-relaxed">
            Answer a few quick questions about water, growth, taxes, and education to see your positions mapped alongside candidates.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            Start ballot questionnaire &rarr;
          </Link>
        </div>

        <div className="pt-8 border-t border-stone-200 max-w-md mx-auto text-xs text-stone-500">
          <p>
            Your answers stay strictly in your local web browser. No accounts or tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Title & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            My Views Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-stone-700">
            {filteredAnswered} answered &middot; {filteredNoOpinion} no opinion &middot; {filteredSkipped} skipped of {filteredTotal}
            {activeRaceFilter.length > 0 && (
              <span className="text-teal-800 ml-1.5 font-semibold">
                (filtered by {activeRaceFilter.length} race{activeRaceFilter.length === 1 ? '' : 's'})
              </span>
            )}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Sorted by importance to your vote. Unset priority defaults to 3 (Moderately important).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-stone-800 transition-colors shadow-2xs"
          >
            <GitCompare className="w-4 h-4 text-teal-400" />
            Compare by race &rarr;
          </Link>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-300 text-stone-700 font-semibold text-xs sm:text-sm rounded-xl hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Compass className="w-4 h-4 text-stone-500" />
            Explore more questions
          </Link>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            title="Reset all my answers"
            aria-label="Reset all answers"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Race Filter Chips (shared persisted state with Explore) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <RaceFilterChips />
      </div>

      {/* If active race filter has 0 answered issues */}
      {answeredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3 shadow-2xs">
          <Compass className="w-8 h-8 text-stone-400 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">
            No answered questions match this race filter
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            You haven&rsquo;t answered any questions in the selected race{activeRaceFilter.length === 1 ? '' : 's'} yet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={clearRaceFilter}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Reset to all races
            </button>
            <Link
              to="/explore"
              className="px-3.5 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors"
            >
              Answer these questions &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Control Bar: Party Assumption Toggle & Category Filter */}
          {(hasPartyAssumedInViews || categories.length > 1) && (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Toggle (hidden if no party-assumed positions exist in relevant candidates) */}
              {hasPartyAssumedInViews && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.includePartyAssumed}
                    onChange={(e) => setIncludePartyAssumed(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-stone-900 block">
                      Include party-based assumptions
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Show estimated stances from official party platforms when candidates have no individual statement
                    </span>
                  </div>
                </label>
              )}

              {/* Category Pills / Filter */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    All ({answeredIssues.length})
                  </button>
                  {categories.map((cat) => {
                    const count = answeredIssues.filter((i) => i.issue.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Clear all your answers?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              This will remove all saved answers from your browser storage. You can restart the questionnaire at any time.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllAnswers();
                  setShowResetConfirm(false);
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Yes, clear answers
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Issues Chart List */}
        <div className="space-y-6">
          {displayedIssues.map(({ issue, answer }) => (
            <IssuePositionChart
              key={issue.id}
              issue={issue}
              answer={answer}
            />
          ))}
        </div>
      </>
    )}
  </div>
);
};
