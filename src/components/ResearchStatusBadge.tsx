import React from 'react';
import type { ResearchStatus } from '../types';

interface ResearchStatusBadgeProps {
  status: ResearchStatus;
  className?: string;
}

export const ResearchStatusBadge: React.FC<ResearchStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'solid':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ${className}`}
          title="Extensive public record or verified questionnaire responses across majority of issues"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Solid research
        </span>
      );
    case 'partial':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ${className}`}
          title="Some public records or statements found, but multiple positions remain unaddressed"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Partial research
        </span>
      );
    case 'limited':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-700 ${className}`}
          title="Candidate has minimal public statements or records on key ballot issues"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
          Limited research
        </span>
      );
  }
};
