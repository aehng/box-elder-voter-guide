import React from 'react';
import { useVoter } from '../context/VoterContext';
import { ShieldCheck, Calendar, Scale, ExternalLink, AlertCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { meta } = useVoter();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          About the Box Elder Voter Guide
        </h1>
        <p className="mt-2 text-base text-stone-600 leading-relaxed max-w-2xl">
          An independent, nonpartisan civic tool created to help northern Utah voters make informed, confident ballot decisions for the November 3, 2026 general election.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Purpose */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-stone-800" />
            <h2 className="text-lg font-bold text-stone-900">Purpose</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Local elections determine water policy, county taxes, law enforcement leadership, and classroom standards, yet finding direct, documented policy positions for local and legislative candidates is often frustratingly difficult.
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            This guide gathers recorded votes, public debates, questionnaires, and official filings into a neutral, side-by-side format so voters in Box Elder County can compare candidates on the issues that matter most.
          </p>
        </section>

        {/* Nonpartisan Commitment */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-stone-800" />
            <h2 className="text-lg font-bold text-stone-900">Strictly Nonpartisan</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            This guide is 100% independent. We have no affiliation with any political party, candidate campaign, political action committee (PAC), or ballot measure advocacy group. We do not accept political donations, sponsorships, or campaign advertising.
          </p>
          <ul className="text-xs sm:text-sm text-stone-600 space-y-1.5 list-disc pl-5 leading-relaxed">
            <li><strong>No candidate endorsements:</strong> We never recommend how to vote.</li>
            <li><strong>No arbitrary winner scoring:</strong> We do not compute a single summary percentage score or designate a &ldquo;best match.&rdquo;</li>
            <li><strong>No partisan color coding:</strong> Candidate party labels are shown strictly as plain text without red or blue branding.</li>
          </ul>
        </section>

        {/* Limitations & Unknown Rule */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-stone-800" />
            <h2 className="text-lg font-bold text-stone-900">Research Limits</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            While we conduct comprehensive research using public records and news reporting, candidates in local races do not always participate in public debates or publish comprehensive platforms.
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Under our research standard, an unanswered questionnaire or absence of a public statement is strictly recorded as <em>Unknown</em>. It is never presumed to indicate opposition or agreement.
          </p>
        </section>

        {/* Official Resources */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <h2 className="text-lg font-bold text-stone-900">Official Utah Election Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href="https://vote.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors block"
            >
              <div className="font-bold text-sm text-stone-900 flex items-center justify-between">
                <span>Utah Voter Information (vote.utah.gov)</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Check your voter registration status and view your personalized official sample ballot.
              </p>
            </a>

            <a
              href="https://www.boxeldercounty.org/clerk/elections"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors block"
            >
              <div className="font-bold text-sm text-stone-900 flex items-center justify-between">
                <span>Box Elder County Clerk Elections</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Official county ballot drop box locations, polling centers, and election results.
              </p>
            </a>
          </div>
        </section>

        {/* Last Updated */}
        <section className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span>Guide database last updated: <strong>{meta.lastUpdated}</strong></span>
          </div>
          <p>Box Elder County, Utah General Election 2026</p>
        </section>
      </div>
    </div>
  );
};
