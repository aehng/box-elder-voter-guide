import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { PositionSlider } from '../components/PositionSlider';
import { ImportanceSlider } from '../components/ImportanceSlider';
import type { UserStance, UserImportance, UserAnswerStatus } from '../types';
import { ArrowLeft, ExternalLink, CheckCircle2, Scale } from 'lucide-react';

export const AmendmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    contests,
    contestMap,
    issueMap,
    sourceMap,
    answers,
    setAnswer,
  } = useVoter();

  // Find contest by id, or by issue id
  let contest = id ? contestMap.get(id) : undefined;
  if (!contest && id) {
    contest = contests.find(
      (c) => c.type === 'amendment' && (c.id === id || c.issueIds.includes(id))
    );
  }

  // Find corresponding issue
  const issue = contest && contest.issueIds.length > 0
    ? issueMap.get(contest.issueIds[0])
    : id
    ? issueMap.get(id)
    : undefined;

  if (!contest || contest.type !== 'amendment') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Amendment not found</h2>
        <p className="text-xs text-stone-600">
          The requested constitutional amendment could not be found on the 2026 Box Elder County ballot.
        </p>
        <Link
          to="/ballot"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot races
        </Link>
      </div>
    );
  }

  const userAns = (issue && answers[issue.id]) || {
    stance: null,
    importance: 3,
    status: 'skipped' as UserAnswerStatus,
    updated: '',
  };

  const handleStanceChange = (stance: UserStance, status: UserAnswerStatus) => {
    if (!issue) return;
    setAnswer(issue.id, {
      stance,
      status,
      importance: userAns.importance ?? 3,
    });
  };

  const handleImportanceChange = (importance: UserImportance) => {
    if (!issue) return;
    setAnswer(issue.id, {
      importance,
      status: userAns.status || 'answered',
    });
  };

  // Human stance description
  const userStanceLabel =
    userAns.status === 'answered' && userAns.stance !== null && issue
      ? userAns.stance === -2
        ? `Against: ${issue.leftLabel}`
        : userAns.stance === 2
        ? `For: ${issue.rightLabel}`
        : userAns.stance === 0
        ? 'Undecided / Neutral'
        : userAns.stance < 0
        ? `Lean Against: ${issue.leftLabel}`
        : `Lean For: ${issue.rightLabel}`
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/ballot"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot races
        </Link>
      </div>

      {/* Hero Header */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
            Statewide Ballot Measure
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            Utah Constitutional Amendment
          </span>
          <span className="text-xs text-stone-500">
            Statewide vote &bull; Box Elder County
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
          {contest.office}
        </h1>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-700 space-y-1.5 leading-relaxed">
          <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
            How it affects your vote:
          </span>
          <p>{contest.howItAffectsVoters}</p>
        </div>

        {contest.whatOfficeDecides && contest.whatOfficeDecides.length > 0 && (
          <div className="pt-2 text-xs sm:text-sm text-stone-600 space-y-1.5">
            <span className="font-semibold text-stone-800 block">
              What this amendment decides:
            </span>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              {contest.whatOfficeDecides.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Question & Arguments Cards */}
      {issue && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              The Ballot Choice
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {issue.question}
            </h2>
            {issue.background && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                {issue.background}
              </p>
            )}
          </div>

          {/* Two Sides Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Against Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 block mb-1">
                  Vote AGAINST (Reject Amendment)
                </span>
                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {issue.leftLabel}
                </h3>
              </div>

              {issue.leftPros && issue.leftPros.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                    Arguments against passing the amendment:
                  </span>
                  <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4 leading-relaxed">
                    {issue.leftPros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {issue.leftCons && issue.leftCons.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                    Drawbacks of keeping the current law:
                  </span>
                  <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4 leading-relaxed">
                    {issue.leftCons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* For Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 block mb-1">
                  Vote FOR (Approve Amendment)
                </span>
                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {issue.rightLabel}
                </h3>
              </div>

              {issue.rightPros && issue.rightPros.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                    Arguments in favor of the amendment:
                  </span>
                  <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4 leading-relaxed">
                    {issue.rightPros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {issue.rightCons && issue.rightCons.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                    Drawbacks & criticisms:
                  </span>
                  <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4 leading-relaxed">
                    {issue.rightCons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Legislative and Campaign Context */}
          {issue.whyLive && (
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs text-xs sm:text-sm text-stone-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs uppercase tracking-wider">
                <Scale className="w-4 h-4 text-stone-600" />
                Legislative & Ballot Context
              </div>
              <p className="leading-relaxed">{issue.whyLive}</p>
            </div>
          )}

          {/* Record Your Position */}
          <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Record your vote on this constitutional amendment
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Saved privately in your browser to help organize your ballot decisions.
              </p>
            </div>

            <PositionSlider
              value={userAns.stance}
              status={userAns.status}
              leftLabel={issue.leftLabel}
              rightLabel={issue.rightLabel}
              onChange={handleStanceChange}
            />

            <ImportanceSlider
              value={userAns.importance}
              onChange={handleImportanceChange}
            />

            {userStanceLabel && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-2 text-xs text-teal-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Your saved choice: <strong>{userStanceLabel}</strong>
                </span>
              </div>
            )}
          </section>

          {/* Citations and Official Sources */}
          {issue.sourceIds && issue.sourceIds.length > 0 && (
            <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900">
                Official Sources & Pamphlet Analysis
              </h3>
              <div className="divide-y divide-stone-100 text-xs">
                {issue.sourceIds.map((sid) => {
                  const s = sourceMap.get(sid);
                  return s ? (
                    <div key={sid} className="py-2.5 flex items-start justify-between gap-4">
                      <div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-stone-900 hover:text-teal-800 underline inline-flex items-center gap-1"
                        >
                          {s.title}
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                        <div className="text-stone-500 mt-0.5">
                          {s.publisher && <span>{s.publisher} &bull; </span>}
                          <span>Accessed: {s.accessed}</span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </section>
          )}
        </section>
      )}
    </div>
  );
};
