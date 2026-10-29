import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import type { ContestGroup, Contest, Candidate } from '../types';
import { ResearchStatusBadge } from '../components/ResearchStatusBadge';
import { ExternalLink, AlertCircle } from 'lucide-react';

export const BallotPage: React.FC = () => {
  const { contests } = useVoter();
  const [selectedGroup, setSelectedGroup] = useState<ContestGroup | 'all'>('all');

  const groups: Array<{ id: ContestGroup; title: string }> = [
    { id: 'federal', title: 'Federal Offices' },
    { id: 'legislature', title: 'Utah State Legislature' },
    { id: 'education', title: 'State & Local Education Boards' },
    { id: 'county', title: 'Box Elder County Offices' },
    { id: 'amendments', title: 'Utah Constitutional Amendments' },
    { id: 'judges', title: 'Judicial Retention' },
  ];

  const filteredContests = selectedGroup === 'all'
    ? contests
    : contests.filter((c) => c.group === selectedGroup);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 min-w-0">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          2026 General Election Ballot
        </h1>
        <p className="mt-2 text-base text-stone-600 max-w-3xl leading-relaxed">
          All candidate races, local county offices, and statewide constitutional amendments scheduled for the November 3, 2026 general election in Box Elder County.
        </p>
      </div>

      {/* Critical District Notice Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">
            Check your exact sample ballot before voting
          </p>
          <p className="text-amber-800 text-xs sm:text-sm">
            Legislative, school board, and commission district boundaries vary depending on your residential address. Do not guess your districts. To view the exact candidates and measures on your official mail-in ballot, visit{' '}
            <a
              href="https://vote.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-950 hover:text-black inline-flex items-center gap-0.5"
            >
              vote.utah.gov
              <ExternalLink className="w-3.5 h-3.5 inline" />
            </a>
            .
          </p>
        </div>
      </div>

      {/* Group Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 min-w-0 max-w-full">
        <button
          type="button"
          onClick={() => setSelectedGroup('all')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            selectedGroup === 'all'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          All Contests ({contests.length})
        </button>
        {groups.map((g) => {
          const count = contests.filter((c) => c.group === g.id).length;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedGroup === g.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {g.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Contests List */}
      <div className="space-y-10">
        {groups
          .filter((g) => selectedGroup === 'all' || selectedGroup === g.id)
          .map((group) => {
            const groupContests = filteredContests.filter((c) => c.group === group.id);
            if (groupContests.length === 0) return null;

            return (
              <section key={group.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    {group.title}
                  </h2>
                  <span className="text-xs text-stone-500 font-medium">
                    {groupContests.length} contest{groupContests.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {groupContests.map((contest) => (
                    <ContestCard key={contest.id} contest={contest} />
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
};

const ContestCard: React.FC<{ contest: Contest }> = ({ contest }) => {
  const { candidateMap, issueMap } = useVoter();

  // If this is Judicial Retention
  if (contest.type === 'judicial') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                Nonpartisan Judicial Retention
              </span>
            </div>
            <h3 className="text-xl font-bold text-stone-900">{contest.office}</h3>
          </div>
          <a
            href="https://judges.utah.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 transition-colors self-start sm:self-auto"
          >
            Utah JPEC Evaluation Reports
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          {contest.howItAffectsVoters}
        </p>

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
          <p className="font-semibold text-stone-900">Judicial retention research coming soon</p>
          <p>
            Utah judges do not run with political party affiliations. Independent evaluations from attorneys, jurors, and courtroom staff are published by the Utah Judicial Performance Evaluation Commission at{' '}
            <a
              href="https://judges.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-900 underline font-medium"
            >
              judges.utah.gov
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  // If this is a Constitutional Amendment
  if (contest.type === 'amendment') {
    const issue = contest.issueIds.length > 0 ? issueMap.get(contest.issueIds[0]) : null;

    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700 mb-2 inline-block">
              Statewide Ballot Measure
            </span>
            <Link
              to={`/amendment/${contest.id}`}
              className="text-xl font-bold text-stone-900 hover:text-teal-900 hover:underline block leading-snug"
            >
              {contest.office}
            </Link>
            {contest.district && (
              <p className="text-xs text-stone-500 mt-1">{contest.district}</p>
            )}
          </div>
          <Link
            to={`/amendment/${contest.id}`}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-teal-700 hover:underline self-start sm:self-auto shrink-0"
          >
            Read full amendment analysis &rarr;
          </Link>
        </div>

        <p className="text-sm text-stone-700 leading-relaxed">
          {contest.howItAffectsVoters}
        </p>

        {issue && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <span className="font-bold text-teal-800 block mb-1">
                FOR (Approve):
              </span>
              <p className="text-stone-600">{issue.rightLabel}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <span className="font-bold text-stone-800 block mb-1">
                AGAINST (Reject):
              </span>
              <p className="text-stone-600">{issue.leftLabel}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard Candidate Race
  const candidateList = contest.candidateIds
    .map((id) => candidateMap.get(id))
    .filter((k): k is Candidate => Boolean(k));

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5">
      {/* Contest Office Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              {contest.group}
            </span>
            {contest.uncontested && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                Unopposed
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-stone-900">{contest.office}</h3>
          {contest.district && (
            <p className="text-xs text-stone-500 mt-1">{contest.district}</p>
          )}
        </div>

        {contest.issueIds.length > 0 && (
          contest.uncontested ? (
            <Link
              to={`/compare?contest=${contest.id}`}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 underline self-start sm:self-auto"
            >
              View candidate context &rarr;
            </Link>
          ) : (
            <Link
              to={`/compare?contest=${contest.id}`}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-stone-800 hover:text-stone-950 underline self-start sm:self-auto"
            >
              Compare in this race &rarr;
            </Link>
          )
        )}
      </div>

      {/* What Office Decides & Impact */}
      <div className="space-y-2 text-xs sm:text-sm text-stone-600">
        <p className="leading-relaxed">
          <strong className="text-stone-800">What this office decides:</strong>{' '}
          {contest.whatOfficeDecides.join(' ')}
        </p>
      </div>

      {/* Candidates Chips / Cards */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
          {contest.uncontested
            ? 'Candidate on Ballot (Unopposed)'
            : `Candidates on Ballot (${candidateList.length})`}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {candidateList.map((cand) => (
            <Link
              key={cand.id}
              to={`/candidate/${cand.id}`}
              className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="font-bold text-sm text-stone-900 group-hover:text-stone-700">
                    {cand.name}
                  </h5>
                  {cand.incumbent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      Incumbent
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-500 mb-2 font-medium">
                  {cand.party || 'Nonpartisan'}
                  {cand.status && cand.status !== 'on ballot' && (
                    <span className="ml-1 text-amber-700 font-normal">({cand.status})</span>
                  )}
                </div>

                {cand.bio && (
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {cand.bio}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                <ResearchStatusBadge status={cand.researchStatus} />
                <span className="text-[11px] font-semibold text-stone-700 group-hover:translate-x-0.5 transition-transform">
                  View record &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
