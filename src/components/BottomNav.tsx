import React from 'react';
import { NavLink } from 'react-router-dom';
import { useVoter } from '../context/VoterContext';
import { Vote, Compass, UserCheck, GitCompare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { answeredCount } = useVoter();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium transition-colors relative ${
      isActive ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-700'
    }`;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-2 py-1 shadow-lg safe-area-pb"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <NavLink to="/ballot" className={navItemClass}>
          <Vote className="w-5 h-5 mb-0.5" />
          <span>Ballot</span>
        </NavLink>

        <NavLink to="/explore" className={navItemClass}>
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Explore</span>
        </NavLink>

        <NavLink to="/my-views" className={navItemClass}>
          <div className="relative">
            <UserCheck className="w-5 h-5 mb-0.5" />
            {answeredCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] flex items-center justify-center bg-teal-600 text-white text-[9px] font-bold rounded-full">
                {answeredCount}
              </span>
            )}
          </div>
          <span>My Matches</span>
        </NavLink>

        <NavLink to="/compare" className={navItemClass}>
          <GitCompare className="w-5 h-5 mb-0.5" />
          <span>Compare</span>
        </NavLink>
      </div>
    </nav>
  );
};
