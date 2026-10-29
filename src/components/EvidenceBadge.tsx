import React from 'react';
import type { EvidenceType } from '../types';

interface EvidenceBadgeProps {
  type: EvidenceType;
  showIcon?: boolean;
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ type, showIcon = true, className = '' }) => {
  switch (type) {
    case 'recorded-vote':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
          title="Direct legislative roll call vote or official commission record"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
          Recorded vote
        </span>
      );

    case 'explicit-statement':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 ${className}`}
          title="Direct quote from debate, forum, questionnaire, or official press statement"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>}
          Public statement
        </span>
      );

    case 'campaign-site':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 ${className}`}
          title="Published on official campaign website or literature"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
          Campaign site
        </span>
      );

    case 'news':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 ${className}`}
          title="Reported by verified independent news reporting"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
          News report
        </span>
      );

    case 'inference':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
          title="Inferred from documented co-sponsorships or related votes"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
          Inference
        </span>
      );

    case 'party-assumed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600 border border-dashed border-stone-400 opacity-90 ${className}`}
          title="Assumed based on cited official party platform (no individual statement found)"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full border border-stone-500 bg-transparent"></span>}
          Party-assumed
        </span>
      );

    case 'unknown':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200 ${className}`}
          title="No public position found during research"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>}
          Unknown
        </span>
      );
  }
};
