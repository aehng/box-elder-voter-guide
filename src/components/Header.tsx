import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { Settings, Info, BookOpen, SlidersHorizontal, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { answeredCount, totalActiveIssuesCount, settings, setIncludePartyAssumed, positions } = useVoter();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasAnyPartyAssumed = React.useMemo(
    () => positions.some((p) => p.evidenceType === 'party-assumed'),
    [positions]
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-stone-900 text-white'
        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-stone-800 transition-colors">
              BE
            </span>
            <div>
              <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg block leading-none">
                Box Elder Voter Guide
              </span>
              <span className="text-[11px] text-stone-600 block leading-tight mt-0.5">
                Nov 3, 2026 General Election
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            <NavLink to="/ballot" className={navLinkClass}>
              Ballot
            </NavLink>
            <NavLink to="/explore" className={navLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/my-views" className={navLinkClass}>
              My Views
              {answeredCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[11px] font-bold rounded-full">
                  {answeredCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/compare" className={navLinkClass}>
              Compare
            </NavLink>
            <NavLink to="/sources" className={navLinkClass}>
              Sources & Methodology
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>

          {/* Actions & Settings */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              aria-label="Settings and Research Preferences"
              className={`p-2 rounded-lg border transition-colors ${
                settings.includePartyAssumed
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
              title="Research Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger toggle for secondary links */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile secondary dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-2 animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
              <span>Questions Answered:</span>
              <span className="font-bold text-stone-800">
                {answeredCount} of {totalActiveIssuesCount}
              </span>
            </div>
            <Link
              to="/sources"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              <BookOpen className="w-4 h-4 text-stone-500" />
              Sources & Methodology
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              <Info className="w-4 h-4 text-stone-500" />
              About Nonpartisan Guide
            </Link>
          </div>
        )}
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-700" />
                Guide Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {hasAnyPartyAssumed && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includePartyAssumed}
                      onChange={(e) => setIncludePartyAssumed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-stone-900">
                        Include party-based assumptions
                      </span>
                      <span className="block text-xs text-stone-600 mt-1 leading-relaxed">
                        By default (off), only documented statements, votes, and campaign publications from the candidate are included. When turned on, positions without candidate statements are estimated from their official state party platform and labeled with dashed badges.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="text-xs text-stone-500 space-y-1">
                <p>
                  <strong>Nonpartisan commitment:</strong> Stances are never colored by party labels. All data is backed by verifiable citations.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-stone-900 text-white font-medium text-sm rounded-lg hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
