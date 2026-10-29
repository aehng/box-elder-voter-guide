import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { VoterProvider } from './context/VoterContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

import { LandingPage } from './pages/LandingPage';
import { BallotPage } from './pages/BallotPage';
import { ExplorePage } from './pages/ExplorePage';
import { MyViewsPage } from './pages/MyViewsPage';
import { ComparePage } from './pages/ComparePage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { JudgeDetailPage } from './pages/JudgeDetailPage';
import { SourcesPage } from './pages/SourcesPage';
import { AboutPage } from './pages/AboutPage';

// Scroll to top helper on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <VoterProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-teal-100 selection:text-teal-950">
          <Header />

          <main className="flex-1 pb-24 md:pb-12">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/ballot" element={<BallotPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/my-views" element={<MyViewsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/candidate/:id" element={<CandidateDetailPage />} />
              <Route path="/issues/:id" element={<IssueDetailPage />} />
              <Route path="/judges/:id" element={<JudgeDetailPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Fallback */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </main>

          <footer className="border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-500 mb-14 md:mb-0">
            <div className="max-w-5xl mx-auto px-4 space-y-2">
              <p className="font-semibold text-stone-700">
                Box Elder County Voter Guide &bull; General Election: Nov 3, 2026
              </p>
              <p>
                Independent, nonpartisan civic research. Not affiliated with any candidate, party, or PAC.
              </p>
            </div>
          </footer>

          <BottomNav />
        </div>
      </HashRouter>
    </VoterProvider>
  );
};

export default App;
