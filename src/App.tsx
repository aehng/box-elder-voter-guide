import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { VoterProvider } from './context/VoterContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';

// Code-split route pages with React.lazy
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BallotPage = lazy(() => import('./pages/BallotPage').then((m) => ({ default: m.BallotPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const MyViewsPage = lazy(() => import('./pages/MyViewsPage').then((m) => ({ default: m.MyViewsPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const CandidateDetailPage = lazy(() => import('./pages/CandidateDetailPage').then((m) => ({ default: m.CandidateDetailPage })));
const IssueDetailPage = lazy(() => import('./pages/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })));
const JudgeDetailPage = lazy(() => import('./pages/JudgeDetailPage').then((m) => ({ default: m.JudgeDetailPage })));
const AmendmentDetailPage = lazy(() => import('./pages/AmendmentDetailPage').then((m) => ({ default: m.AmendmentDetailPage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((m) => ({ default: m.SourcesPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));

const withBoundary = (element: React.ReactNode) => (
  <ErrorBoundary>{element}</ErrorBoundary>
);

// Accessible loading fallback
const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8 text-stone-500 text-xs">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-stone-200 border-t-teal-700 rounded-full animate-spin" />
      <span>Loading page...</span>
    </div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={withBoundary(<LandingPage />)} />
                <Route path="/ballot" element={withBoundary(<BallotPage />)} />
                <Route path="/explore" element={withBoundary(<ExplorePage />)} />
                <Route path="/my-views" element={withBoundary(<MyViewsPage />)} />
                <Route path="/my-matches" element={withBoundary(<MyViewsPage />)} />
                <Route path="/compare" element={withBoundary(<ComparePage />)} />
                <Route path="/compare/:contestId" element={withBoundary(<ComparePage />)} />
                <Route path="/candidate/:id" element={withBoundary(<CandidateDetailPage />)} />
                <Route path="/issues/:id" element={withBoundary(<IssueDetailPage />)} />
                <Route path="/judges/:id" element={withBoundary(<JudgeDetailPage />)} />
                <Route path="/amendment/:id" element={withBoundary(<AmendmentDetailPage />)} />
                <Route path="/amendments/:id" element={withBoundary(<AmendmentDetailPage />)} />
                <Route path="/sources" element={withBoundary(<SourcesPage />)} />
                <Route path="/about" element={withBoundary(<AboutPage />)} />
                {/* Fallback */}
                <Route path="*" element={withBoundary(<LandingPage />)} />
              </Routes>
            </Suspense>
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
