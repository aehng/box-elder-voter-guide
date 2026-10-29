import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { PositionSlider } from '../components/PositionSlider';
import { ImportanceSlider } from '../components/ImportanceSlider';
import { MiniPositionChart } from '../components/MiniPositionChart';
import type { UserStance, UserImportance, UserAnswerStatus } from '../types';
import {
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    issueMap,
    contestMap,
    candidateMap,
    positionsByIssue,
    sourceMap,
    answers,
    setAnswer,
  } = useVoter();

  const issue = id ? issueMap.get(id) : undefined;

  if (!issue) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Issue not found</h2>
        <p className="text-xs text-stone-600">The requested ballot issue does not exist.</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to questions
        </Link>
      </div>
    );
  }

  const rawPositions = positionsByIssue.get(issue.id) || [];
  const userAns = answers[issue.id] || {
    stance: null,
    importance: 3,
    status: 'skipped' as UserAnswerStatus,
    updated: '',
  };

  const associatedContests = issue.contestIds
    .map((cid) => contestMap.get(cid))
    .filter(Boolean);

  // Group candidate positions
  const candidatesWithPositions = rawPositions
    .map((p) => {
      const cand = candidateMap.get(p.candidateId);
      if (!cand) return null;
      return { pos: p, cand };
    })
    .filter(Boolean);

  const handleStanceChange = (stance: UserStance, status: UserAnswerStatus) => {
    setAnswer(issue.id, {
      stance,
      status,
      importance: userAns.importance ?? 3,
    });
  };

  const handleImportanceChange = (importance: UserImportance) => {
    setAnswer(issue.id, {
      importance,
      status: userAns.status || 'answered',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot questionnaire
        </Link>
      </div>

      {/* Main Issue Header */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
            {issue.category}
          </span>
          {associatedContests.map((c) => (
            <span
              key={c?.id}
              className="text-xs font-medium px-2 py-0.5 rounded bg-stone-200 text-stone-800"
            >
              {c?.office}
            </span>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
          {issue.question}
        </h1>

        {issue.background && (
          <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
            {issue.background}
          </p>
        )}

        {issue.whyLive && (
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
            <span className="font-bold text-stone-900 block">Why this matters on the 2026 ballot:</span>
            <p className="leading-relaxed">{issue.whyLive}</p>
          </div>
        )}
      </section>

      {/* Side-by-side policy cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Option */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block mb-1">
              Option A (Position −2)
            </span>
            <h2 className="text-base font-bold text-stone-900 leading-snug">
              {issue.leftLabel}
            </h2>
          </div>

          {issue.leftPros && issue.leftPros.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                Arguments in favor:
              </span>
              <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                {issue.leftPros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
          )}

          {issue.leftCons && issue.leftCons.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                Drawbacks & criticisms:
              </span>
              <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                {issue.leftCons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Option */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block mb-1">
              Option B (Position +2)
            </span>
            <h2 className="text-base font-bold text-stone-900 leading-snug">
              {issue.rightLabel}
            </h2>
          </div>

          {issue.rightPros && issue.rightPros.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                Arguments in favor:
              </span>
              <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
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
              <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                {issue.rightCons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* User Stance interactive box */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-stone-900">
          Set or update your stance on this issue
        </h2>

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
      </section>

      {/* Mini Position Chart */}
      <section>
        <MiniPositionChart
          issueId={issue.id}
          userStance={userAns.stance}
        />
      </section>

      {/* Candidate Positions list */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900">
            All Candidates&rsquo; Stances on this Issue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Documented roll calls, statements, and campaign records.
          </p>
        </div>

        <div className="space-y-4">
          {candidatesWithPositions.map((item) => {
            if (!item) return null;
            const { pos, cand } = item;

            return (
              <div
                key={cand.id}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Link
                      to={`/candidate/${cand.id}`}
                      className="font-bold text-base text-stone-900 hover:underline"
                    >
                      {cand.name}
                    </Link>
                    <span className="text-xs text-stone-500 ml-2">
                      ({cand.party || 'Nonpartisan'})
                    </span>
                  </div>
                  <EvidenceBadge type={pos.evidenceType} />
                </div>

                {pos.position !== null ? (
                  <>
                    <div className="text-xs font-semibold text-stone-800">
                      Stance value: {pos.position > 0 ? `+${pos.position}` : pos.position}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {pos.summary}
                    </p>
                    {pos.sourceIds && pos.sourceIds.length > 0 && (
                      <div className="pt-1 text-xs text-stone-500 flex flex-wrap gap-2">
                        <span className="font-semibold text-stone-600">Source:</span>
                        {pos.sourceIds.map((sid) => {
                          const s = sourceMap.get(sid);
                          return s ? (
                            <a
                              key={sid}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 hover:underline inline-flex items-center gap-0.5"
                            >
                              {s.title}
                              <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                          ) : null;
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    No public stance found for this candidate during nonpartisan research.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sources list for this issue */}
      {issue.sourceIds && issue.sourceIds.length > 0 && (
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900">
            Issue Citations & Legal Background
          </h2>
          <div className="divide-y divide-stone-100 text-xs">
            {issue.sourceIds.map((sid) => {
              const s = sourceMap.get(sid);
              return s ? (
                <div key={sid} className="py-2.5">
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
              ) : null;
            })}
          </div>
        </section>
      )}
    </div>
  );
};
