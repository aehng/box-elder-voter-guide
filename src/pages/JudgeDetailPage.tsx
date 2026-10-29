import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Scale } from 'lucide-react';

export const JudgeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <Link
          to="/ballot"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ballot
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700">
          <Scale className="w-6 h-6" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Nonpartisan Judicial Retention
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Judicial Retention Evaluation
          </h1>
          <p className="text-xs text-stone-500 mt-1">Judge ID: {id || 'Retention seat'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-950 space-y-2">
          <p className="font-bold">Judicial retention research coming soon</p>
          <p className="text-xs leading-relaxed text-amber-900">
            Utah trial and appellate judges do not run as partisan candidates. Utah uses a merit-retention election system. Performance evaluations from attorneys, litigants, court observers, and staff are conducted independently by the Utah Judicial Performance Evaluation Commission (JPEC).
          </p>
        </div>

        <div className="pt-2">
          <a
            href="https://judges.utah.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors shadow-xs"
          >
            <span>Visit Utah JPEC evaluation reports</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
