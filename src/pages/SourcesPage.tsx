import React, { useState, useMemo } from 'react';
import { useVoter } from '../context/VoterContext';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { Search, ExternalLink, Scale } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const { sources } = useVoter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');

  const publishers = useMemo(() => {
    const set = new Set<string>();
    sources.forEach((s) => {
      if (s.publisher) set.add(s.publisher);
    });
    return Array.from(set).sort();
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (selectedPublisher !== 'all' && s.publisher !== selectedPublisher) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesPub = (s.publisher || '').toLowerCase().includes(q);
        const matchesUrl = s.url.toLowerCase().includes(q);
        return matchesTitle || matchesPub || matchesUrl;
      }
      return true;
    });
  }, [sources, selectedPublisher, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Sources & Research Methodology
        </h1>
        <p className="mt-2 text-base text-stone-600 max-w-3xl leading-relaxed">
          Every policy stance, vote, and candidate statement in this guide is derived from verifiable, dated public records. Learn how research is conducted, evidence is weighted, and sources are cited.
        </p>
      </div>

      {/* Methodology Section */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
          <Scale className="w-5 h-5 text-stone-800" />
          <h2 className="text-xl font-bold text-stone-900">
            Our Research Methodology
          </h2>
        </div>

        {/* 1. Evidence Types Explained */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-stone-900">
            1. Evidence Types & Badges
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            We categorize every candidate position with an evidence badge so voters can immediately know the origin of the information:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="recorded-vote" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct roll-call votes in Congress, the Utah State Legislature, or official Box Elder County Commission meetings. Highest level of verification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="explicit-statement" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct quotes from candidate debates, public forums, questionnaires (such as Utah News Dispatch, Salt Lake Tribune, or Vote411), or official press statements.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="campaign-site" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Published policy statements, platform pages, and campaign materials authorized by the candidate&rsquo;s official campaign committee.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="news" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Independent reporting from established local and statewide news outlets covering northern Utah races.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="inference" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Inferred from legislative co-sponsorships or related committee votes. Used sparingly and clearly marked.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
              <EvidenceBadge type="party-assumed" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Estimated from the official state party platform (Utah Republican, Democratic, or Libertarian Party) when a candidate has made no personal statement. Excluded by default unless the user enables the setting.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 sm:col-span-2">
              <EvidenceBadge type="unknown" />
              <p className="text-xs text-stone-600 leading-relaxed">
                No public statement, recorded vote, or response was found. Under our rules, lack of response is never assumed to be opposition.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Position Scale & Null vs 0 */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <h3 className="text-base font-bold text-stone-900">
            2. The 5-Stop Position Scale &amp; Null vs. Zero
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Policy stances are mapped onto a 5-stop numerical scale:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 font-semibold">
              <span className="text-[11px] text-stone-700">Strongly: &lt;first option&gt;</span>
            </div>
            <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 font-semibold">
              <span className="text-[11px] text-stone-700">Lean: &lt;first option&gt;</span>
            </div>
            <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 font-semibold">
              <span className="text-[11px] text-teal-900 font-bold">Middle ground</span>
            </div>
            <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 font-semibold">
              <span className="text-[11px] text-stone-700">Lean: &lt;second option&gt;</span>
            </div>
            <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 font-semibold">
              <span className="text-[11px] text-stone-700">Strongly: &lt;second option&gt;</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-700 space-y-2">
            <h4 className="font-bold text-stone-900">
              Crucial Distinction: Position 0 vs. Position Null
            </h4>
            <ul className="space-y-1.5 list-disc pl-5 text-xs text-stone-600 leading-relaxed">
              <li>
                <strong className="text-stone-800">Position 0 (Middle ground):</strong> Represents an explicit, documented compromise or balanced position (for example, supporting both agricultural water rights and conservation leases to the Great Salt Lake).
              </li>
              <li>
                <strong className="text-stone-800">Position null (Unknown):</strong> Represents an absence of public evidence. When a candidate has not commented or voted on an issue, their position is strictly recorded as null. It is never counted toward agreement or disagreement with the user.
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Nonpartisan Commitments */}
        <div className="space-y-3 pt-4 border-t border-stone-200">
          <h3 className="text-base font-bold text-stone-900">
            3. Nonpartisan Standards
          </h3>
          <ul className="text-xs sm:text-sm text-stone-600 space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>We do not accept candidate submissions that cannot be verified by dated citations.</li>
            <li>We do not score candidates with a single summary percentage or designate a &ldquo;winner.&rdquo;</li>
            <li>We do not use party color coding (red/blue) to prevent partisan bias.</li>
          </ul>
        </div>
      </section>

      {/* Sourced Citations Table */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              All Cited Sources ({sources.length})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Search and filter every source cited across candidates, contests, and ballot questions.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title or publisher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs w-full sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {publishers.length > 1 && (
              <select
                value={selectedPublisher}
                onChange={(e) => setSelectedPublisher(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 bg-stone-50"
              >
                <option value="all">All Publishers ({publishers.length})</option>
                {publishers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredSources.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-6 text-center">
            No sources matched your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="p-3">Source Title</th>
                  <th className="p-3">Publisher</th>
                  <th className="p-3">Published Date</th>
                  <th className="p-3">Accessed Date</th>
                  <th className="p-3 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3 font-medium text-stone-900 max-w-sm">
                      {source.title}
                    </td>
                    <td className="p-3 text-stone-600 whitespace-nowrap">
                      {source.publisher || '—'}
                    </td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {source.published || '—'}
                    </td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {source.accessed}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:text-teal-900 underline font-semibold inline-flex items-center gap-1"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
