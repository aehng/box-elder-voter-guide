import React from 'react';
import { Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import {
  Compass,
  Vote,
  ShieldCheck,
  Search,
  Scale,
  Calendar,
  MapPin,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { contests, answeredCount } = useVoter();

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="pt-8 pb-10 sm:pt-14 sm:pb-16 text-center max-w-3xl mx-auto px-4">
        {/* Civic pill banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium mb-6">
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>Election Day: Tuesday, November 3, 2026</span>
          <span className="text-stone-300">•</span>
          <MapPin className="w-3.5 h-3.5 text-stone-500" />
          <span>Box Elder County, Utah</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Find out where you stand.
        </h1>

        <p className="mt-4 text-base sm:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
          Explore the issues, understand your candidates, and make an informed voting decision.
        </p>

        {/* Call to action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/explore"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 text-white font-semibold text-base shadow-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5 text-teal-400" />
            {answeredCount > 0 ? `Continue questionnaire (${answeredCount} answered)` : 'Explore my ballot'}
          </Link>

          <Link
            to="/ballot"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-stone-800 font-semibold text-base border border-stone-300 shadow-2xs hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
          >
            <Vote className="w-5 h-5 text-stone-600" />
            Research candidates
          </Link>
        </div>

        {/* Official ballot note */}
        <p className="mt-5 text-xs text-stone-500 max-w-md mx-auto">
          Covers races on Box Elder County ballots. Because legislative and school districts vary by home address, check your official sample ballot at{' '}
          <a
            href="https://vote.utah.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-700 underline font-medium hover:text-stone-900 inline-flex items-center gap-0.5"
          >
            vote.utah.gov
            <ExternalLink className="w-3 h-3 inline" />
          </a>
          .
        </p>
      </section>

      {/* Guide Highlights / Key Pillars */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-4 text-stone-800">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-stone-900 mb-2">Neutral & Nonpartisan</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            No red or blue color coding, no scorecards, and no candidate endorsements. Positions are presented side by side with documented evidence.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-4 text-stone-800">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-stone-900 mb-2">Sourced from Records</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Every stance cites roll-call votes, floor debates, questionnaires, or verified reporting. If a candidate has no public record, we say so clearly.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-4 text-stone-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-stone-900 mb-2">Private in Your Browser</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Your answers stay on your device in your local browser storage. No account is required and no personal responses are sent to a server.
          </p>
        </div>
      </section>

      {/* Overview of Contests on the 2026 Ballot */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Races on the Box Elder Ballot
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {contests.length} contests including federal, legislative, education, county seats, and state constitutional amendments.
            </p>
          </div>
          <Link
            to="/ballot"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-stone-900 hover:underline"
          >
            View full ballot <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to="/ballot"
              className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  {c.group.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                  {c.office}
                </h3>
                {c.district && (
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">{c.district}</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>{c.candidateIds.length} candidate{c.candidateIds.length === 1 ? '' : 's'}</span>
                <span className="font-medium text-stone-800 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                  Explore &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/ballot"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-900 bg-white border border-stone-300 px-4 py-2.5 rounded-xl shadow-2xs"
          >
            View all {contests.length} ballot contests <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How It Works 3-Step Walkthrough */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            How to use this voter guide
          </h2>
          <p className="text-stone-300 text-sm max-w-2xl mb-8 leading-relaxed">
            Follow these three straightforward steps to go from questions to an informed ballot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-stone-800/80 p-5 rounded-2xl border border-stone-700">
              <span className="w-7 h-7 rounded-full bg-teal-500 text-stone-900 font-extrabold text-sm flex items-center justify-center mb-3">
                1
              </span>
              <h3 className="font-bold text-base mb-1">Answer the issues</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Take our quick issue questionnaire. Rate what matters to you and where you lean on local water, growth, taxes, and schools.
              </p>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-2xl border border-stone-700">
              <span className="w-7 h-7 rounded-full bg-teal-500 text-stone-900 font-extrabold text-sm flex items-center justify-center mb-3">
                2
              </span>
              <h3 className="font-bold text-base mb-1">Inspect candidate records</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Review verified voting records, public statements, and policy stances. We distinguish recorded votes from campaign promises.
              </p>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-2xl border border-stone-700">
              <span className="w-7 h-7 rounded-full bg-teal-500 text-stone-900 font-extrabold text-sm flex items-center justify-center mb-3">
                3
              </span>
              <h3 className="font-bold text-base mb-1">Compare without hype</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Check where you agree or differ with each candidate race by race. No overall percentage scores, no algorithm picking a winner.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center sm:text-left">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-900 font-semibold text-sm hover:bg-stone-100 transition-colors"
            >
              Start the questionnaire <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
