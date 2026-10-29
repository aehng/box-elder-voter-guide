import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  UserAnswersMap,
  UserSettings,
  UserAnswer,
  UserStance,
  UserImportance,
  UserAnswerStatus,
  Contest,
  Candidate,
  Issue,
  Position,
  Fact,
  Source,
  MetaData
} from '../types';

import contestsData from '../data/contests.json';
import candidatesData from '../data/candidates.json';
import issuesData from '../data/issues.json';
import positionsData from '../data/positions.json';
import factsData from '../data/facts.json';
import sourcesData from '../data/sources.json';
import metaData from '../data/meta.json';

const STORAGE_ANSWERS_KEY = 'bevg.answers.v1';
const STORAGE_SETTINGS_KEY = 'bevg.settings.v1';

export type AlignmentDirection = 'agree' | 'differ' | 'middle' | 'unknown' | 'assumed';

interface VoterContextValue {
  // Data
  contests: Contest[];
  candidates: Candidate[];
  issues: Issue[];
  positions: Position[];
  facts: Fact[];
  sources: Source[];
  meta: MetaData;

  // Maps for fast lookup
  contestMap: Map<string, Contest>;
  candidateMap: Map<string, Candidate>;
  issueMap: Map<string, Issue>;
  sourceMap: Map<string, Source>;
  positionsByCandidate: Map<string, Position[]>;
  positionsByIssue: Map<string, Position[]>;
  factsByCandidate: Map<string, Fact[]>;

  // User state
  answers: UserAnswersMap;
  settings: UserSettings;
  setAnswer: (
    issueId: string,
    update: { stance?: UserStance; importance?: UserImportance; status?: UserAnswerStatus }
  ) => void;
  clearAnswer: (issueId: string) => void;
  resetAllAnswers: () => void;
  setIncludePartyAssumed: (include: boolean) => void;

  // Helpers
  answeredCount: number;
  skippedCount: number;
  totalActiveIssuesCount: number;
  getAlignment: (
    userStance: UserStance,
    candPosition: Position | undefined,
    includePartyAssumedOverride?: boolean
  ) => AlignmentDirection;
}

const VoterContext = createContext<VoterContextValue | null>(null);

function loadInitialAnswers(): UserAnswersMap {
  try {
    const raw = localStorage.getItem(STORAGE_ANSWERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse saved answers from localStorage:', err);
  }
  return {};
}

function loadInitialSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse saved settings from localStorage:', err);
  }
  return { includePartyAssumed: false };
}

export const VoterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contests = contestsData as Contest[];
  const candidates = candidatesData as Candidate[];
  const issues = issuesData as Issue[];
  const positions = positionsData as Position[];
  const facts = factsData as Fact[];
  const sources = sourcesData as Source[];
  const meta = metaData as MetaData;

  const [answers, setAnswers] = useState<UserAnswersMap>(loadInitialAnswers);
  const [settings, setSettings] = useState<UserSettings>(loadInitialSettings);

  // Sync answers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(answers));
    } catch (err) {
      console.error('Failed to persist answers to localStorage:', err);
    }
  }, [answers]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to persist settings to localStorage:', err);
    }
  }, [settings]);

  // Build lookups
  const contestMap = useMemo(() => new Map(contests.map((c) => [c.id, c])), [contests]);
  const candidateMap = useMemo(() => new Map(candidates.map((k) => [k.id, k])), [candidates]);
  const issueMap = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);
  const sourceMap = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);

  const positionsByCandidate = useMemo(() => {
    const map = new Map<string, Position[]>();
    for (const p of positions) {
      const list = map.get(p.candidateId) || [];
      list.push(p);
      map.set(p.candidateId, list);
    }
    return map;
  }, [positions]);

  const positionsByIssue = useMemo(() => {
    const map = new Map<string, Position[]>();
    for (const p of positions) {
      const list = map.get(p.issueId) || [];
      list.push(p);
      map.set(p.issueId, list);
    }
    return map;
  }, [positions]);

  const factsByCandidate = useMemo(() => {
    const map = new Map<string, Fact[]>();
    for (const f of facts) {
      const list = map.get(f.candidateId) || [];
      list.push(f);
      map.set(f.candidateId, list);
    }
    return map;
  }, [facts]);

  const setAnswer = (
    issueId: string,
    update: { stance?: UserStance; importance?: UserImportance; status?: UserAnswerStatus }
  ) => {
    setAnswers((prev) => {
      const existing = prev[issueId] || {
        stance: null,
        importance: null,
        status: 'answered' as UserAnswerStatus,
        updated: new Date().toISOString(),
      };

      const updatedAnswer: UserAnswer = {
        stance: update.stance !== undefined ? update.stance : existing.stance,
        importance: update.importance !== undefined ? update.importance : existing.importance,
        status: update.status !== undefined ? update.status : existing.status,
        updated: new Date().toISOString(),
      };

      return {
        ...prev,
        [issueId]: updatedAnswer,
      };
    });
  };

  const clearAnswer = (issueId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[issueId];
      return copy;
    });
  };

  const resetAllAnswers = () => {
    setAnswers({});
  };

  const setIncludePartyAssumed = (include: boolean) => {
    setSettings((prev) => ({ ...prev, includePartyAssumed: include }));
  };

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.status === 'answered' && a.stance !== null).length;
  }, [answers]);

  const skippedCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.status === 'skipped').length;
  }, [answers]);

  const totalActiveIssuesCount = issues.length;

  const getAlignment = (
    userStance: UserStance,
    candPosition: Position | undefined,
    includePartyAssumedOverride?: boolean
  ): AlignmentDirection => {
    const includeAssumed = includePartyAssumedOverride ?? settings.includePartyAssumed;

    if (userStance === null || !candPosition || candPosition.position === null) {
      return 'unknown';
    }

    if (candPosition.evidenceType === 'party-assumed' && !includeAssumed) {
      return 'assumed';
    }

    const cVal = candPosition.position;
    const uVal = userStance;

    if (cVal === 0 || uVal === 0) {
      return 'middle';
    }

    if ((uVal > 0 && cVal > 0) || (uVal < 0 && cVal < 0)) {
      return 'agree';
    }

    return 'differ';
  };

  return (
    <VoterContext.Provider
      value={{
        contests,
        candidates,
        issues,
        positions,
        facts,
        sources,
        meta,
        contestMap,
        candidateMap,
        issueMap,
        sourceMap,
        positionsByCandidate,
        positionsByIssue,
        factsByCandidate,
        answers,
        settings,
        setAnswer,
        clearAnswer,
        resetAllAnswers,
        setIncludePartyAssumed,
        answeredCount,
        skippedCount,
        totalActiveIssuesCount,
        getAlignment,
      }}
    >
      {children}
    </VoterContext.Provider>
  );
};

export function useVoter(): VoterContextValue {
  const context = useContext(VoterContext);
  if (!context) {
    throw new Error('useVoter must be used within a VoterProvider');
  }
  return context;
}
