import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ResearchStatusBadge } from '../components/ResearchStatusBadge';
import type { AlignmentDirection } from '../types';
import {
  ExternalLink,
  AlertTriangle,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
  Globe,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    candidateMap,
    contestMap,
    issueMap,
    positionsByCandidate,
    factsByCandidate,
    sourceMap,
    answers,
    getAlignment,
  } = useVoter();

  const candidate = id ? candidateMap.get(id) : undefined;

  if (!candidate) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Candidate not found</h2>
        <p className="text-xs text-stone-600">
          The requested candidate could not be found on the 2026 ballot.
        </p>
        <Link
          to="/ballot"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot
        </Link>
      </div>
    );
  }

  const contest = contestMap.get(candidate.contestId);
  const candPositions = positionsByCandidate.get(candidate.id) || [];
  const candFacts = factsByCandidate.get(candidate.id) || [];

  // Group facts
  const trackRecordFacts = candFacts.filter((f) =>
    ['vote', 'bill', 'record'].includes(f.kind)
  );

  const argumentFacts = candFacts.filter((f) =>
    ['accomplishment', 'criticism', 'endorsement'].includes(f.kind)
  );

  // Other candidates in the contest
  const otherCandidates = (contest?.candidateIds || [])
    .filter((cid) => cid !== candidate.id)
    .map((cid) => candidateMap.get(cid))
    .filter(Boolean);

  // Issues in this contest
  const contestIssues = (contest?.issueIds || [])
    .map((iid) => issueMap.get(iid))
    .filter(Boolean);

  // Unknown issues for this candidate
  const unknownIssues = contestIssues.filter((issue) => {
    const pos = candPositions.find((p) => p.issueId === issue?.id);
    return !pos || pos.position === null || pos.evidenceType === 'unknown';
  });

  // Unique sources
  const candidateSourceIds = new Set<string>();
  (candidate.sourceIds || []).forEach((sid) => candidateSourceIds.add(sid));
  candPositions.forEach((p) => (p.sourceIds || []).forEach((sid) => candidateSourceIds.add(sid)));
  candFacts.forEach((f) => (f.sourceIds || []).forEach((sid) => candidateSourceIds.add(sid)));

  const candidateSources = Array.from(candidateSourceIds)
    .map((sid) => sourceMap.get(sid))
    .filter(Boolean);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/ballot"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot races
        </Link>
      </div>

      {/* Header & Overview Section */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {contest && (
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-stone-100 text-stone-700">
                  {contest.office}
                </span>
              )}
              {candidate.incumbent && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  Incumbent
                </span>
              )}
              <ResearchStatusBadge status={candidate.researchStatus} />
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              {candidate.name}
            </h1>

            <div className="mt-1 text-sm font-medium text-stone-600">
              {candidate.party || 'Nonpartisan'}
              {candidate.status && candidate.status !== 'on ballot' && (
                <span className="ml-1.5 text-amber-700">({candidate.status})</span>
              )}
            </div>
          </div>

          {candidate.campaignUrl && (
            <a
              href={candidate.campaignUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors self-start sm:self-auto border border-stone-200"
            >
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>Official campaign site</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-stone-700 leading-relaxed max-w-3xl">
            {candidate.bio}
          </p>
        )}

        {candidate.background && candidate.background.length > 0 && (
          <div className="pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Career & Background Facts
            </h2>
            <ul className="text-xs sm:text-sm text-stone-600 space-y-1 list-disc pl-5">
              {candidate.background.map((bg, idx) => (
                <li key={idx}>{bg}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Limited Research Banner if applicable */}
      {candidate.researchStatus === 'limited' && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <h2 className="font-bold text-sm sm:text-base">
              Public information limited
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
            This candidate has minimal public voting records, candidate questionnaire responses, or campaign statements on key 2026 ballot issues. In keeping with our nonpartisan standards, lack of a public record is strictly reported as &ldquo;Unknown&rdquo; and is never presumed as opposition.
          </p>
          {unknownIssues.length > 0 && (
            <div className="pt-1">
              <span className="text-xs font-semibold text-amber-900 block mb-1">
                Issues with no public statement found:
              </span>
              <ul className="text-xs text-amber-800 list-disc pl-5 space-y-0.5">
                {unknownIssues.map((i) => (
                  <li key={i?.id}>{i?.question}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Compared With You Section */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">
          Compared with You
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          How {candidate.name}&rsquo;s verified stances compare against your answers on ballot issues for this race.
        </p>

        <div className="space-y-3 pt-2">
          {contestIssues.map((issue) => {
            if (!issue) return null;
            const pos = candPositions.find((p) => p.issueId === issue.id);
            const userAns = answers[issue.id];
            const uStance = userAns && userAns.status === 'answered' ? userAns.stance : null;
            const align = getAlignment(uStance, pos);

            return (
              <div
                key={issue.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                    {issue.category}
                  </span>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="font-bold text-stone-900 hover:underline"
                  >
                    {issue.question}
                  </Link>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Your stance:</span>
                    <span className="font-semibold text-stone-800">
                      {uStance !== null ? (uStance > 0 ? `+${uStance}` : uStance) : 'Unanswered'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block">Their stance:</span>
                    <span className="font-semibold text-stone-800">
                      {pos && pos.position !== null ? (pos.position > 0 ? `+${pos.position}` : pos.position) : 'Unknown'}
                    </span>
                  </div>

                  <div className="min-w-[85px] text-right">
                    {formatDirectionBadge(align)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Policy Positions by Issue */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900">
            Policy Positions & Documented Records
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Value spectrum from −2 to +2 backed by verified citations.
          </p>
        </div>

        <div className="space-y-6">
          {contestIssues.map((issue) => {
            if (!issue) return null;
            const pos = candPositions.find((p) => p.issueId === issue.id);

            return (
              <div
                key={issue.id}
                className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                      {issue.category}
                    </span>
                    <Link
                      to={`/issues/${issue.id}`}
                      className="font-bold text-sm sm:text-base text-stone-900 hover:underline"
                    >
                      {issue.question}
                    </Link>
                  </div>
                  {pos && <EvidenceBadge type={pos.evidenceType} />}
                </div>

                {pos && pos.position !== null ? (
                  <div className="space-y-3 pt-2">
                    {/* Value bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Position: <strong className="text-stone-900">{pos.position > 0 ? `+${pos.position}` : pos.position}</strong></span>
                        <span className="capitalize text-[11px]">Confidence: {pos.confidence}</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full relative">
                        <div
                          className="w-3.5 h-3.5 rounded-full bg-stone-900 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-xs"
                          style={{ left: `${((pos.position + 2) / 4) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400 pt-0.5">
                        <span className="truncate max-w-[45%]">−2: {issue.leftLabel}</span>
                        <span className="truncate max-w-[45%] text-right">+2: {issue.rightLabel}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {pos.summary}
                    </p>

                    {pos.date && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>Documented date: {pos.date}</span>
                      </div>
                    )}

                    {pos.sourceIds && pos.sourceIds.length > 0 && (
                      <div className="text-xs text-stone-500 pt-1 border-t border-stone-200 flex flex-wrap gap-2">
                        <span className="font-semibold text-stone-600">Citations:</span>
                        {pos.sourceIds.map((sid) => {
                          const s = sourceMap.get(sid);
                          return s ? (
                            <a
                              key={sid}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 hover:underline inline-flex items-center gap-0.5 mr-2"
                            >
                              {s.title}
                              <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-xs text-stone-500 italic">
                    No verified public statement or recorded vote found for this candidate.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Track Record & Facts */}
      {trackRecordFacts.length > 0 && (
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              Track Record (Votes, Bills & Official Records)
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {trackRecordFacts.map((fact, idx) => (
              <div key={idx} className="py-3.5 space-y-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-stone-400 text-[11px]">
                  <span className="uppercase font-bold tracking-wider text-stone-500">
                    {fact.kind}
                  </span>
                  {fact.date && <span>{fact.date}</span>}
                </div>
                <p className="text-stone-800 leading-relaxed">{fact.text}</p>
                {fact.sourceIds && fact.sourceIds.length > 0 && (
                  <div className="pt-1 text-[11px] text-stone-500 flex flex-wrap gap-2">
                    {fact.sourceIds.map((sid) => {
                      const s = sourceMap.get(sid);
                      return s ? (
                        <a
                          key={sid}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-600 hover:text-stone-900 underline inline-flex items-center gap-0.5"
                        >
                          {s.title}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Arguments & Criticisms */}
      {argumentFacts.length > 0 && (
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              Accomplishments, Criticisms & Endorsements
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {argumentFacts.map((fact, idx) => (
              <div key={idx} className="py-3.5 space-y-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-stone-400 text-[11px]">
                  <span
                    className={`uppercase font-bold tracking-wider ${
                      fact.kind === 'criticism'
                        ? 'text-amber-800'
                        : fact.kind === 'accomplishment'
                        ? 'text-emerald-800'
                        : 'text-stone-600'
                    }`}
                  >
                    {fact.kind}
                  </span>
                  {fact.date && <span>{fact.date}</span>}
                </div>
                <p className="text-stone-800 leading-relaxed">{fact.text}</p>
                {fact.sourceIds && fact.sourceIds.length > 0 && (
                  <div className="pt-1 text-[11px] text-stone-500 flex flex-wrap gap-2">
                    {fact.sourceIds.map((sid) => {
                      const s = sourceMap.get(sid);
                      return s ? (
                        <a
                          key={sid}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-600 hover:text-stone-900 underline inline-flex items-center gap-0.5"
                        >
                          {s.title}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Compared With Others in Contest */}
      {otherCandidates.length > 0 && (
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900">
            Other Candidates in this Race
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherCandidates.map((other) => {
              if (!other) return null;
              return (
                <Link
                  key={other.id}
                  to={`/candidate/${other.id}`}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{other.name}</h3>
                    <div className="text-xs text-stone-500">{other.party || 'Nonpartisan'}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <ResearchStatusBadge status={other.researchStatus} />
                    <span className="text-xs font-semibold text-stone-700">View &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sources Bibliography List */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">
          Sources & Citations ({candidateSources.length})
        </h2>
        <div className="divide-y divide-stone-100 text-xs">
          {candidateSources.map((source) => {
            if (!source) return null;
            return (
              <div key={source.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-stone-900 hover:text-teal-800 underline inline-flex items-center gap-1"
                  >
                    {source.title}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                  <div className="text-stone-500 mt-0.5">
                    {source.publisher && <span>{source.publisher}</span>}
                    {source.published && <span> &bull; Published: {source.published}</span>}
                    <span> &bull; Accessed: {source.accessed}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
